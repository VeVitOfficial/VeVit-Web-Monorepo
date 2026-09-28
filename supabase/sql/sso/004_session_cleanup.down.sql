select cron.unschedule(jobid)
from cron.job
where jobname = 'vevit-session-cleanup';
