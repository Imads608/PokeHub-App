import { RedisBattleService } from './redis.service';
import type { QueueEntry } from './redis.types';
import type { AppLogger } from '@pokehub/backend/shared-logger';
import type Redis from 'ioredis';

function makeEntry(userId: string): QueueEntry {
  return {
    userId,
    teamId: `${userId}-team`,
    packedTeam: 'Pikachu||||||||||',
    joinedAt: 1_700_000_000,
  };
}

describe('RedisBattleService.popQueueEntries', () => {
  let client: jest.Mocked<Pick<Redis, 'eval' | 'rpush'>>;
  let logger: jest.Mocked<Pick<AppLogger, 'debug'>>;
  let service: RedisBattleService;

  beforeEach(() => {
    client = {
      eval: jest.fn(),
      rpush: jest.fn(),
    } as unknown as jest.Mocked<Pick<Redis, 'eval' | 'rpush'>>;
    logger = { debug: jest.fn() } as unknown as jest.Mocked<
      Pick<AppLogger, 'debug'>
    >;
    service = new RedisBattleService(
      client as unknown as Redis,
      logger as unknown as AppLogger
    );
  });

  it('pops entries via an atomic EVAL keyed on the format queue (Redis 6.0 safe)', async () => {
    const entries = [makeEntry('a'), makeEntry('b')];
    client.eval.mockResolvedValue(entries.map((e) => JSON.stringify(e)));

    const result = await service.popQueueEntries('gen9ou', 2);

    expect(result).toEqual(entries);
    // Uses EVAL (not the 6.2-only `RPOP key count`) against the format queue key,
    // guarded by an LLEN check so it pops all-or-nothing.
    expect(client.eval).toHaveBeenCalledWith(
      expect.stringContaining('RPOP'),
      1,
      'queue:gen9ou',
      2
    );
    expect(client.eval).toHaveBeenCalledWith(
      expect.stringContaining('LLEN'),
      1,
      'queue:gen9ou',
      2
    );
    expect(client.rpush).not.toHaveBeenCalled();
  });

  it('returns null and leaves the queue intact when fewer than requested are waiting', async () => {
    // Atomic script pops nothing when there are fewer than `count` entries
    // (e.g. a single player waiting), so there is nothing to push back. This
    // avoids a transient-empty window that getQueueCounts() could misread.
    client.eval.mockResolvedValue([]);

    const result = await service.popQueueEntries('gen9ou', 2);

    expect(result).toBeNull();
    expect(client.rpush).not.toHaveBeenCalled();
  });

  it('returns null without pushing back when the queue is empty', async () => {
    client.eval.mockResolvedValue([]);

    const result = await service.popQueueEntries('gen9ou', 2);

    expect(result).toBeNull();
    expect(client.rpush).not.toHaveBeenCalled();
  });
});
