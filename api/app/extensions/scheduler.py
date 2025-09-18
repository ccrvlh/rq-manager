from rq_scheduler import Scheduler  # type: ignore[import]
from rq_scheduler.utils import from_unix  # type: ignore[import]
from rq_scheduler.utils import rationalize_until


class RQSchedulerRegistry(Scheduler):
    """Custom Scheduler class for RQ Manager."""

    def get_jobs_ids(self, until=None, with_times=False, offset=None, length=None) -> list[str]:
        """
        Returns a list of job ids that will be queued until the given
        time. If no 'until' argument is given all jobs are returned.

        If with_times is True, a list of tuples consisting of the job instance
        and it's scheduled execution time is returned.

        If offset and length are specified, a slice of the list starting at the
        specified zero-based offset of the specified length will be returned.

        If either of offset or length is specified, then both must be, or
        an exception will be raised.
        """

        def epoch_to_datetime(epoch):
            return from_unix(float(epoch))

        until = rationalize_until(until)
        job_ids = self.connection.zrangebyscore(
            self.scheduled_jobs_key, 0, until, withscores=with_times, score_cast_func=epoch_to_datetime, start=offset, num=length
        )
        return job_ids
