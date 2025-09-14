#!/usr/bin/env python3
"""
Simple RQ Sampler - Data Generator for RQ Manager.

This sampler generates RQ workloads without any monitoring or complex features.
Just spins up workers and creates jobs to generate data for the RQ Manager to monitor.
"""

import sys
import time
import random
import logging
import subprocess

from typing import Dict
from typing import List
from typing import Callable
from typing import Optional
from datetime import datetime
from dataclasses import dataclass

from rq import Queue
from rq import Worker

from app.config import AppConfig
from app.config import AppConfigBuilder
from app.core.redis import RedisManager


# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class JobDefinition:
    """Definition of a job for sampling."""

    name: str
    function: Callable
    kwargs: dict = None
    queue: str = "default"
    timeout: int = 180


@dataclass
class QueueDefinition:
    """Definition of a queue for sampling."""

    name: str
    default_timeout: int = 180


@dataclass
class WorkerDefinition:
    """Definition of a worker for sampling."""

    name: str
    queues: List[str]


class SampleJobFunctions:
    """Simple job functions for generating data."""

    @staticmethod
    def quick_task(name: str, delay: float = 0.1):
        """Quick task."""
        time.sleep(delay)
        return f"Quick task {name} completed"

    @staticmethod
    def cpu_task(iterations: int = 1000000):
        """CPU task."""
        result = 0
        for i in range(iterations):
            result += i**2
        return "CPU task completed"

    @staticmethod
    def io_task(size: int = 100):
        """I/O task."""
        data = "x" * (size * 1024)
        time.sleep(0.1)
        return f"I/O task processed {size}KB"

    @staticmethod
    def failing_task():
        """Task that fails sometimes."""
        if random.random() < 0.2:  # 20% failure rate
            raise Exception("Task failed")
        return "Task succeeded"

    @staticmethod
    def long_task(duration: int = 5):
        """Long running task."""
        time.sleep(duration)
        return "Long task completed"


class SimpleRQSampler:
    """Simple RQ Sampler - just generates data, no monitoring."""

    def __init__(self, redis_config: Optional[Dict] = None):
        """Initialize the sampler."""
        self.setup_configuration(redis_config)
        self.redis_manager = RedisManager()
        self.redis = self.redis_manager.get_connection()
        self.worker_processes: Dict[str, subprocess.Popen] = {}
        self.running = True

    def setup_configuration(self, redis_config: Optional[Dict] = None):
        """Setup configuration."""
        settings = AppConfig()
        if redis_config:
            for key, value in redis_config.items():
                setattr(settings, f"APP_REDIS_{key.upper()}", value)

        config_builder = AppConfigBuilder(settings)
        config_builder.load()

    def create_queue(self, queue_def: QueueDefinition):
        """Create a queue."""
        queue = Queue(queue_def.name, connection=self.redis, default_timeout=queue_def.default_timeout)
        logger.info(f"Created queue: {queue_def.name}")
        return queue

    def create_job(self, job_def: JobDefinition):
        """Create and enqueue a job."""
        queue = Queue(job_def.queue, connection=self.redis)

        kwargs = job_def.kwargs or {}
        meta = {"sampler_created": True, "created_at": datetime.now().isoformat(), "job_name": job_def.name}

        job = queue.enqueue_call(
            job_def.function,
            kwargs=kwargs,
            timeout=job_def.timeout,
            result_ttl=604800,  # 7 days
            ttl=job_def.timeout + 300,  # Job TTL
            failure_ttl=86400,  # 24 hours for failed jobs
            meta=meta,
        )

        logger.info(f"Created job: {job.id} on queue {job_def.queue}")
        return job.id

    def start_worker(self, worker_def: WorkerDefinition):
        """Start a worker process."""
        # Clean up any existing worker with the same name
        self._cleanup_existing_worker(worker_def.name)

        queue_names_str = "', '".join(worker_def.queues)
        worker_code = f"""
import sys
import os
import logging
import time

# Add the api directory to Python path instead of using __file__
current_dir = os.path.dirname(os.path.abspath('{__file__}'))
api_dir = os.path.dirname(current_dir)
sys.path.insert(0, api_dir)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from rq import Queue
    from rq import Worker
    from app.config import AppConfig
    from app.config import AppConfigBuilder
    from app.core.redis import RedisManager
    
    logger.info("Starting worker initialization...")
    
    # Setup config
    settings = AppConfig()
    config_builder = AppConfigBuilder(settings)
    config_builder.load()
    logger.info("Configuration loaded")

    redis_manager = RedisManager()
    redis = redis_manager.get_connection()
    logger.info("Redis connection established")

    # Test Redis connection
    try:
        redis.ping()
        logger.info("Redis ping successful")
    except Exception as e:
        logger.error(f"Redis ping failed: {{e}}")
        sys.exit(1)

    # Create queues
    queue_names = ['{queue_names_str}']
    queues = [Queue(name, connection=redis) for name in queue_names]
    logger.info(f"Created queues: {{queue_names}}")

    # Start worker
    logger.info(f"Creating worker '{worker_def.name}'...")
    worker = Worker(queues, name='{worker_def.name}', connection=redis)
    logger.info(f"Worker '{worker_def.name}' created, starting work...")
    
    # worker.work() will handle registration automatically
    worker.work()
    
except Exception as e:
    logger.error(f"Worker failed to start: {{e}}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
"""

        cmd = [sys.executable, "-c", worker_code]

        # Capture stderr to see worker errors
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)

        self.worker_processes[worker_def.name] = process
        logger.info(f"Started worker {worker_def.name} (PID {process.pid})")

        # Start a thread to monitor worker output
        def monitor_worker_output():
            import threading

            def read_output(pipe, prefix):
                import select

                while True:
                    if pipe.closed:
                        break
                    # Check if there's data to read
                    readable, _, _ = select.select([pipe], [], [], 0.1)
                    if readable:
                        line = pipe.readline()
                        if line:
                            logger.info(f"{prefix}: {line.strip()}")
                        else:
                            break

            stdout_thread = threading.Thread(target=read_output, args=(process.stdout, f"Worker-{worker_def.name}-OUT"))
            stderr_thread = threading.Thread(target=read_output, args=(process.stderr, f"Worker-{worker_def.name}-ERR"))

            stdout_thread.daemon = True
            stderr_thread.daemon = True

            stdout_thread.start()
            stderr_thread.start()

        monitor_worker_output()

        return process

    def generate_workload(self, num_queues: int = 3, num_workers: int = 2, jobs_per_minute: int = 10, duration_minutes: int = 5):
        """Generate a continuous workload."""
        logger.info(
            f"Generating workload: {num_queues} queues, {num_workers} workers, "
            f"{jobs_per_minute} jobs/min for {duration_minutes} min"
        )

        queue_names = []
        for i in range(num_queues):
            queue_def = QueueDefinition(f"sampler_queue_{i}")
            self.create_queue(queue_def)
            queue_names.append(queue_def.name)

        # Start workers
        for i in range(num_workers):
            worker_def = WorkerDefinition(f"sampler_worker_{i}", queue_names)
            self.start_worker(worker_def)

        # Calculate timing
        job_interval = 60.0 / jobs_per_minute
        total_jobs = jobs_per_minute * duration_minutes
        jobs_created = 0

        logger.info(f"Creating {total_jobs} jobs over {duration_minutes} minutes...")

        # Job creation loop
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)

        while jobs_created < total_jobs and time.time() < end_time:
            try:
                # Pick random queue and job type
                queue_name = random.choice(queue_names)
                job_type = random.choice(['quick', 'cpu', 'io', 'failing', 'long'])

                # Create job definition
                if job_type == 'quick':
                    kwargs = {'name': f'Job_{jobs_created}', 'delay': 0.1}
                    func = SampleJobFunctions.quick_task
                elif job_type == 'cpu':
                    kwargs = {'iterations': random.randint(100000, 500000)}
                    func = SampleJobFunctions.cpu_task
                elif job_type == 'io':
                    kwargs = {'size': random.randint(10, 100)}
                    func = SampleJobFunctions.io_task
                elif job_type == 'failing':
                    kwargs = {}
                    func = SampleJobFunctions.failing_task
                else:  # long
                    kwargs = {'duration': random.randint(2, 10)}
                    func = SampleJobFunctions.long_task

                # Create job
                job_def = JobDefinition(name=f'{job_type}_job_{jobs_created}', function=func, kwargs=kwargs, queue=queue_name)

                self.create_job(job_def)
                jobs_created += 1

                # Progress every 50 jobs
                if jobs_created % 50 == 0:
                    logger.info(f"Created {jobs_created}/{total_jobs} jobs")

                # Wait for next job
                time.sleep(job_interval)

            except Exception as e:
                logger.error(f"Error creating job: {e}")
                time.sleep(job_interval)

        logger.info(f"Finished creating {jobs_created} jobs")

        # Let workers process remaining jobs
        logger.info("Letting workers process remaining jobs for 2 minutes...")
        time.sleep(120)  # Wait 2 minutes for jobs to finish

        logger.info("Workload generation complete")

        # Check what workers are registered in Redis
        self.check_workers_in_redis()

    def check_workers_in_redis(self):
        """Check what workers are registered in Redis."""
        logger.info("Checking workers in Redis...")

        try:
            # Get all worker keys from Redis
            worker_keys = self.redis.keys("rq:worker:*")
            logger.info(f"Found {len(worker_keys)} worker keys in Redis")

            for key in worker_keys:
                key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                logger.info(f"Worker key: {key_str}")

                # Get worker data
                try:
                    worker_data = self.redis.hgetall(key)
                    logger.info(f"Worker data: {worker_data}")
                except Exception as e:
                    logger.error(f"Error getting worker data for {key_str}: {e}")

            # Check RQ workers using the library
            try:
                from rq import Worker

                all_workers = Worker.all(connection=self.redis)
                logger.info(f"RQ Worker.all() found {len(all_workers)} workers")

                for worker in all_workers:
                    logger.info(f"RQ Worker: {worker.name}, state: {worker.get_state()}")

            except Exception as e:
                logger.error(f"Error getting workers with RQ Worker.all(): {e}")

        except Exception as e:
            logger.error(f"Error checking workers in Redis: {e}")
            import traceback

            traceback.print_exc()

    def _cleanup_existing_worker(self, worker_name: str):
        """Clean up any existing worker with the given name from Redis."""
        try:

            # Try to find and clean up the existing worker
            worker_key = f"rq:worker:{worker_name}"

            # Check if worker key exists
            if self.redis.exists(worker_key):
                logger.info(f"Found existing worker '{worker_name}' in Redis, cleaning up...")

                # Remove the worker key
                self.redis.delete(worker_key)
                logger.info(f"Removed worker key: {worker_key}")

                # Also remove from worker registry
                worker_registry_key = "rq:workers"
                self.redis.srem(worker_registry_key, worker_name)
                logger.info(f"Removed '{worker_name}' from worker registry")

            # Double-check with RQ
            try:
                existing_worker = Worker.find_by_key(worker_key, connection=self.redis)
                if existing_worker:
                    # Force cleanup
                    existing_worker.connection = self.redis
                    try:
                        existing_worker.register_death()
                        logger.info(f"Force-registered death for worker '{worker_name}'")
                    except Exception:
                        # If register_death fails, just delete the keys
                        pass

            except Exception as e:
                logger.debug(f"Could not find existing worker with RQ: {e}")

        except Exception as e:
            logger.warning(f"Error cleaning up existing worker '{worker_name}': {e}")

    def cleanup(self):
        """Clean up worker processes."""
        logger.info("Cleaning up worker processes...")
        self.running = False

        for name, process in self.worker_processes.items():
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()

        self.worker_processes.clear()
        logger.info("Cleanup complete")
