import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { OpenWrtSingleton } from '~/tools/singleton/OpenWrtSingleton';

export const openwrtShadowsocksRRouter = createTRPCRouter({
  status: publicProcedure
    .input(
      z.object({
        configName: z.string(),
        appId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const openwrt = OpenWrtSingleton.getOrSet(input.configName, input.appId);
      return openwrt.getShadowsocksRStatus();
    }),

  info: publicProcedure
    .input(
      z.object({
        configName: z.string(),
        appId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const openwrt = OpenWrtSingleton.getOrSet(input.configName, input.appId);
      return openwrt.getShadowsocksRInfo();
    }),

  check: publicProcedure
    .input(
      z.object({
        configName: z.string(),
        appId: z.string(),
        testObject: z.enum(['google', 'baidu']),
      }),
    )
    .mutation(async ({ input }) => {
      const openwrt = OpenWrtSingleton.getOrSet(input.configName, input.appId);
      return openwrt.checkShadowsocksRConnectivity(input.testObject);
    }),

  changeServer: publicProcedure
    .input(
      z.object({
        configName: z.string(),
        appId: z.string(),
        serverName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const openwrt = OpenWrtSingleton.getOrSet(input.configName, input.appId);
      return openwrt.changeShadowsocksRGlobalServer(input.serverName);
    }),
});
