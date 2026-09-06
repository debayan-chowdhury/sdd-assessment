jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../src/services/transferRequestWorkflow.service', () => ({ applyAllDueOrgUpdates: jest.fn() }));

const cron = require('node-cron');
const { applyAllDueOrgUpdates } = require('../../src/services/transferRequestWorkflow.service');
const { startDueOrgUpdatesJob } = require('../../src/jobs/dueOrgUpdates.job');

function scheduledCallback() {
  return cron.schedule.mock.calls[cron.schedule.mock.calls.length - 1][1];
}

beforeEach(() => {
  cron.schedule.mockReset();
  applyAllDueOrgUpdates.mockReset();
});

describe('dueOrgUpdates.job#startDueOrgUpdatesJob', () => {
  it('schedules a recurring job on the expected cron expression', () => {
    startDueOrgUpdatesJob();
    expect(cron.schedule).toHaveBeenCalledWith('*/15 * * * *', expect.any(Function));
  });

  it('calls applyAllDueOrgUpdates and logs when updates were applied', async () => {
    applyAllDueOrgUpdates.mockResolvedValue(2);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    startDueOrgUpdatesJob();
    await scheduledCallback()();

    expect(applyAllDueOrgUpdates).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('applied 2'));
    logSpy.mockRestore();
  });

  it('does not log when there is nothing due', async () => {
    applyAllDueOrgUpdates.mockResolvedValue(0);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    startDueOrgUpdatesJob();
    await scheduledCallback()();

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('logs an error instead of throwing when applyAllDueOrgUpdates rejects', async () => {
    applyAllDueOrgUpdates.mockRejectedValue(new Error('boom'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    startDueOrgUpdatesJob();
    await expect(scheduledCallback()()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith('[dueOrgUpdatesJob] failed:', 'boom');
    errorSpy.mockRestore();
  });
});
