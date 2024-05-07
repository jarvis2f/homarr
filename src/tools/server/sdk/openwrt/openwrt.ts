import Consola from 'consola';
import { ShadowsocksRConfigType } from '~/tools/server/sdk/openwrt/openwrt.schema';

export class OpenWrtClient {
  private token: string | undefined;

  constructor(
    private readonly hostname: string,
    private readonly username: string,
    private readonly password: string,
  ) {
  }

  async login(): Promise<string> {
    if (this.token) {
      if (await this.validateToken()) {
        return this.token;
      }
    }
    const response = await fetch(`${this.hostname}/cgi-bin/luci/rpc/auth`, {
      method: 'POST',
      body: JSON.stringify({
        id: 1,
        method: 'login',
        params: [this.username, this.password],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to login to OpenWrt: ${response.status}`);
    }

    const body = await response.json();
    if (body.error !== null || body.result === null) {
      throw new Error(`Failed to login to OpenWrt ${body.error ?? ''}`);
    }
    this.token = body.result;
    return this.token!;
  }

  async getShadowsocksRStatus() {
    const token = await this.login();
    const response = await fetch(`${this.hostname}/cgi-bin/luci/admin/services/shadowsocksr/run?${new Date().getTime()}`, {
      headers: {
        'Cookie': `sysauth_http=${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }
    const body = await response.json();
    return body?.running === true;
  }

  async getShadowsocksRInfo(): Promise<ShadowsocksRConfigType | undefined> {
    const configs = await this.getAllConfigs('shadowsocksr');
    if (!configs) {
      return undefined;
    }
    const servers = [{
      name: 'nil',
      server: '',
      alias: '❎ Stop',
    }];
    let globalServerName;
    for (const config of Object.values(configs) as any[]) {
      if (config['.type'] === 'servers') {
        servers.push({
          name: config['.name'],
          server: config.server,
          alias: config.alias,
        });
      }
      if (config['.type'] === 'global') {
        globalServerName = config.global_server;
      }
    }
    const globalServer = configs[globalServerName];

    return {
      global: {
        name: globalServerName,
        alias: globalServer?.alias,
        server: globalServer?.server,
      },
      servers,
    };
  }

  async checkShadowsocksRConnectivity(testObject: 'google' | 'baidu'): Promise<boolean> {
    const token = await this.login();
    const response = await fetch(`${this.hostname}/cgi-bin/luci/admin/services/shadowsocksr/check?set=${testObject}&${new Date().getTime()}`, {
      headers: {
        'Cookie': `sysauth_http=${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }
    const body = await response.json();
    return body?.ret === 0;
  }

  async changeShadowsocksRGlobalServer(serverName: string): Promise<boolean> {
    const set = await this.setConfig({
      config: 'shadowsocksr',
      section: '@global[0]',
      option: 'global_server',
      value: serverName,
    });
    if (!set) {
      return false;
    }

    return this.commitConfig('shadowsocksr');
  }

  async getAllConfigs(config: string) {
    const body = await this.uci('get_all', [config]);
    return body?.result;
  }

  async setConfig({ config, section, option, value }: {
    config: string;
    section: string;
    option: string;
    value: string;
  }) {
    const body = await this.uci('set', [config, section, option, value]);
    return body?.result === true;
  }

  async applyConfig(config: string) {
    const body = await this.uci('apply', [config]);
    return body?.result != null;
  }

  async commitConfig(config: string) {
    const body = await this.uci('commit', [config]);
    return body?.result != null;
  }

  async uci(method: string, params: any[]) {
    const token = await this.login();
    const response = await fetch(`${this.hostname}/cgi-bin/luci/rpc/uci?auth=${token}`, {
      method: 'POST',
      body: JSON.stringify({
        method,
        params,
      }),
    });

    if (!response.ok) {
      Consola.error('uci', method, params, response.status);
      return false;
    }
    const body = await response.json();
    if (body.error !== null) {
      Consola.error('uci', method, params, body.error);
      return false;
    }
    Consola.debug('uci', response.status, body);
    return body;
  }

  async validateToken() {
    const body = await this.sys('uptime', [], this.token);
    if (!body) {
      this.token = undefined;
      return false;
    }
    return body.result !== null;
  }

  async sys(method: string, params: any[], token?: string) {
    if (!token) {
      token = await this.login();
    }
    const response = await fetch(`${this.hostname}/cgi-bin/luci/rpc/sys?auth=${token}`, {
      method: 'POST',
      body: JSON.stringify({
        method,
        params,
      }),
    });

    if (!response.ok) {
      Consola.error('sys', method, params, response.status);
      return false;
    }
    const body = await response.json();
    if (body.error !== null) {
      Consola.error('sys', method, params, body.error);
      return false;
    }
    Consola.debug('sys', response.status, body);
    return body;
  }
}
