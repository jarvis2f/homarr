import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { OpenWrtSingleton } from '~/tools/singleton/OpenWrtSingleton';

export const openwrtShadowsocksRRouter = createTRPCRouter({
  status: protectedProcedure
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

  info: protectedProcedure
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

  check: protectedProcedure
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

  changeServer: protectedProcedure
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
