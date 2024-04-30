import { z } from 'zod';

export const shadowsocksRServerSchema = z.object({
  name: z.string(),
  alias: z.string(),
  server: z.string(),
});

export const shadowsocksRConfigSchema = z.object({
  global: shadowsocksRServerSchema,
  servers: z.array(
    shadowsocksRServerSchema,
  ),
});

export type ShadowsocksRServerType = z.infer<typeof shadowsocksRServerSchema>;
export type ShadowsocksRConfigType = z.infer<typeof shadowsocksRConfigSchema>;
