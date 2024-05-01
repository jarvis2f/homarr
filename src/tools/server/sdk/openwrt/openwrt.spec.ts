import { describe, expect, it } from 'vitest';
import { OpenWrtClient } from '~/tools/server/sdk/openwrt/openwrt';

describe('Openwrt client', () => {
  const emptyResponse = {
    body: JSON.stringify({
      id: null,
      result: null,
      error: null,
    }),
    status: 200,
  };

  it('should log in again when the token expires', async () => {
    fetchMock.mockResponseOnce((request) => {
      if (request.url === 'http://openwrt.local/cgi-bin/luci/rpc/auth') {
        return Promise.resolve({
          body: JSON.stringify({
            id: 1,
            result: 'token',
            error: null,
          }),
          status: 200,
        });
      }
      return Promise.resolve(emptyResponse);
    });

    const openwrt = new OpenWrtClient(
      'http://openwrt.local',
      'root',
      'password',
    );
    expect(await openwrt.login()).toBe('token');

    fetchMock.mockResponseOnce((request) => {
      if (request.url === 'http://openwrt.local/cgi-bin/luci/rpc/sys?auth=token') {
        return Promise.resolve({
          status: 403,
        });
      }
      return Promise.resolve(emptyResponse);
    });
    fetchMock.mockResponseOnce((request) => {
      if (request.url === 'http://openwrt.local/cgi-bin/luci/rpc/auth') {
        return Promise.resolve({
          body: JSON.stringify({
            id: 1,
            result: 'new-token',
            error: null,
          }),
          status: 200,
        });
      }
      return Promise.resolve(emptyResponse);
    });
    expect(await openwrt.login()).toBe('new-token');
  });
});
