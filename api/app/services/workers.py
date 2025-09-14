"""Worker service that interacts with RQ to get worker information."""

import logging

from typing import Optional

import rq
import redis

from app.const import RQ_SCHEDULER_INSTANCE_KEY_PREFIX
from app.schemas.workers import WorkerState
from app.schemas.workers import WorkerStatus
from app.schemas.workers import WorkerDetails
from app.schemas.workers import WorkerListFilters
from app.utils.datetime_utils import ensure_timezone_aware
from app.utils.datetime_utils import get_timezone_aware_now


logger = logging.getLogger(__name__)


class WorkerService:
    """Service for managing RQ worker information."""

    def __init__(self, redis: redis.Redis):
        """Initialize the worker service with RQ connection."""
        self.redis = redis

    def list_workers(self, include_dead: bool = True) -> list[WorkerDetails]:
        """Get all existing RQ workers.

        Args:
            include_dead (bool, optional): Whether to include dead workers. Defaults to True.

        Returns:
            list[WorkerDetails]: List of worker details.
        """
        active_workers = rq.Worker.all(connection=self.redis)
        workers = [self._map_rq_worker_to_schema(worker) for worker in active_workers if worker]
        return workers

    def get_worker(self, worker_id: str) -> Optional[WorkerDetails]:
        """Get a specific worker by identifier.

        Args:
            worker_id (str): Worker identifier.

        Returns:
            Optional[WorkerDetails]: Worker if found else None.
        """
        try:
            key = rq.Worker.redis_worker_namespace_prefix + worker_id
            worker = rq.Worker.find_by_key(key, connection=self.redis)
            return self._map_rq_worker_to_schema(worker) if worker else None

        except Exception as e:
            logger.error(f"Error getting worker {worker_id}: {e}")
            return None

    def get_worker_counts(self) -> dict[str, int]:
        """Get counts of workers by status.

        Returns:
            dict[str, int]: Mapping of status to counts.
        """
        workers = self.list_workers()

        counts = {"total": len(workers), "busy": 0, "idle": 0, "starting": 0, "suspended": 0, "busy_long": 0, "dead": 0}

        for worker in workers:
            status = worker.status
            if status == WorkerStatus.BUSY:
                counts["busy"] += 1
            elif status == WorkerStatus.IDLE:
                counts["idle"] += 1
            elif status == WorkerStatus.STARTED:
                counts["starting"] += 1
            elif status == WorkerStatus.SUSPENDED:
                counts["suspended"] += 1
            elif status == WorkerStatus.BUSY_LONG:
                counts["busy_long"] += 1
            elif status == WorkerStatus.DEAD:
                counts["dead"] += 1

        return counts

    def filter_workers(self, filters: WorkerListFilters) -> list[WorkerDetails]:
        """Filter workers based on given criteria.

        Args:
            filters (WorkerListFilters): Filtering conditions including status,
                queues, hostname, kind, search, healthy_only, active_only, sorting, pagination.

        Returns:
            list[WorkerDetails]: Filtered set of workers.
        """
        workers = self.list_workers()
        filtered = []

        for worker in workers:
            if filters.status and worker.status != filters.status:
                continue

            if filters.queues and not any(queue in (worker.queues or []) for queue in filters.queues):
                continue

            if filters.hostname and filters.hostname.lower() not in str(worker.hostname or "").lower():
                continue

            if filters.worker_kind and worker.worker_kind != filters.worker_kind:
                continue

            if filters.search and not self._matches_search(worker, filters.search):
                continue

            if filters.healthy_only and not worker.is_healthy:
                continue

            if filters.active_only and worker.state in [WorkerState.DEAD, WorkerState.STOPPED]:
                continue

            filtered.append(worker)

        sort_by = filters.sort_by or "name"
        sort_order = filters.sort_order or "asc"

        def get_sort_key(worker):
            value = getattr(worker, sort_by, None)
            if isinstance(value, str):
                return value.lower()
            return value

        filtered.sort(key=get_sort_key, reverse=(sort_order == "desc"))
        offset = filters.offset or 0
        limit = filters.limit or 50

        return filtered[offset : offset + limit]

    def _matches_search(self, worker: WorkerDetails, search: str) -> bool:
        """Check if worker matches search criteria.

        Args:
            worker (WorkerDetails): Worker to test.
            search (str): Search text.

        Returns:
            bool: True if worker matches, False otherwise.
        """
        search_terms = search.lower().split()
        searchable_fields = [
            worker.name or "",
            str(worker.hostname or ""),
            str(worker.current_job_func or ""),
            " ".join(worker.queues or []),
            " ".join(worker.tags or []),
        ]

        search_text = " ".join(searchable_fields).lower()

        return all(term in search_text for term in search_terms)

    def _map_rq_worker_to_schema(self, rq_worker: rq.Worker) -> WorkerDetails:
        """Map RQ worker object to WorkerDetails schema."""
        try:
            birth_date = rq_worker.birth_date if hasattr(rq_worker, 'birth_date') else None
            last_heartbeat = rq_worker.last_heartbeat if hasattr(rq_worker, 'last_heartbeat') else None
            busy_since = rq_worker.busy_since if hasattr(rq_worker, 'busy_since') else None
            status = self._map_rq_status_to_schema(rq_worker.get_state())
            queues = getattr(rq_worker, 'queues', []) or []
            queue_names = [q.name for q in queues] if queues else []
            job = rq_worker.get_current_job()
            current_job_id = job.id if job else None
            current_job_func = job.func_name if job else None
            is_scheduler = self._is_scheduler_worker(rq_worker)

            worker = WorkerDetails(
                created_at=ensure_timezone_aware(rq_worker.birth_date) or get_timezone_aware_now(),
                id=rq_worker.name,
                name=rq_worker.name,
                hostname=getattr(rq_worker, 'hostname', None),
                pid=getattr(rq_worker, 'pid', None),
                queues=queue_names,
                current_queue=getattr(rq_worker, 'queue_name', queue_names[0] if queue_names else None),
                status=status,
                current_job_id=current_job_id,
                current_job_func=current_job_func,
                birth_date=birth_date,
                last_heartbeat=last_heartbeat,
                busy_since=busy_since,
                worker_version=getattr(rq_worker, 'version', None),
                python_version=getattr(rq_worker, 'python_version', None),
                updated_at=get_timezone_aware_now(),
                is_scheduler=is_scheduler,
            )

            worker.created_at = ensure_timezone_aware(birth_date) or get_timezone_aware_now()
            return worker

        except Exception as e:
            logger.error(f"Error mapping RQ worker {rq_worker.name}: {e}")
            return WorkerDetails(
                id=str(getattr(rq_worker, 'name', 'unknown')),
                name=str(getattr(rq_worker, 'name', 'unknown')),
                created_at=get_timezone_aware_now(),
                updated_at=get_timezone_aware_now(),
            )

    def _is_scheduler_worker(self, rq_worker: rq.worker.BaseWorker) -> bool:
        """Check if worker is running RQ Scheduler.

        Args:
            rq_worker (rq.Worker): RQ worker.

        Returns:
            bool: Whether this worker is a scheduler.
        """
        try:
            if 'scheduler' in rq_worker.name.lower():
                return True

            scheduler_keys = self.redis.keys(f"{RQ_SCHEDULER_INSTANCE_KEY_PREFIX}:*")
            if scheduler_keys:
                all_workers = rq.Worker.all(connection=self.redis)
                if len(all_workers) == 1:
                    return True

                worker_queues = getattr(rq_worker, 'queues', [])
                if not worker_queues:
                    return True

            if hasattr(rq_worker, 'current_job') and rq_worker.current_job:
                job = rq_worker.current_job
                if hasattr(job, 'func_name') and 'scheduler' in str(job.func_name).lower():
                    return True

            return False
        except Exception:
            return False

    def _map_rq_status_to_schema(self, rq_status: str) -> WorkerStatus:
        """Map RQ worker status to our schema status.

        Args:
            rq_status (str): Status string from RQ.

        Returns:
            WorkerStatus: Enum value corresponding to the status.
        """
        status_mapping = {
            'started': WorkerStatus.STARTED,
            'idle': WorkerStatus.IDLE,
            'busy': WorkerStatus.BUSY,
            'suspended': WorkerStatus.SUSPENDED,
            'dead': WorkerStatus.DEAD,
        }
        return status_mapping.get(rq_status.lower(), WorkerStatus.IDLE)
