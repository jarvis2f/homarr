import { Badge, Button, Select, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconBrandBaidu, IconBrandGoogle, IconSend } from '@tabler/icons-react';
import { defineWidget } from '~/widgets/helper';
import { IWidget } from '~/widgets/widgets';
import { api } from '~/utils/api';
import { useConfigContext } from '~/config/provider';
import { useEffect, useState } from 'react';
import { WidgetLoading } from '~/widgets/loading';
import { notifications } from '@mantine/notifications';
import { ShadowsocksRServerType } from '~/tools/server/sdk/openwrt/openwrt.schema';

const definition = defineWidget({
  id: 'openwrt/shadowsocksR',
  icon: IconSend,
  options: {},
  gridstack: {
    minWidth: 2,
    minHeight: 2,
    maxWidth: 12,
    maxHeight: 12,
  },
  component: ShadowsocksRWidgetTile,
});

export type ShadowsocksRWidget = IWidget<(typeof definition)['id'], typeof definition>;

interface ShadowsocksRWidgetTileProps {
  widget: ShadowsocksRWidget;
}

function ShadowsocksRWidgetTile({ widget }: ShadowsocksRWidgetTileProps) {
  const { config, name } = useConfigContext();
  const openwrtApps =
    config?.apps.filter((x) => x.integration && x.integration.type === 'openwrt') ?? [];
  const [selectedAppId, setSelectedApp] = useState<string | null>(openwrtApps[0]?.id);

  const { data: info, isLoading: infoLoading, error: infoError } = api.openwrtShadowsocksR.info.useQuery({
    configName: name ?? '',
    appId: selectedAppId ?? '',
  });

  const { data: status, isLoading: statusLoading } = api.openwrtShadowsocksR.status.useQuery({
    configName: name ?? '',
    appId: selectedAppId ?? '',
  });

  useEffect(() => {
    if (!selectedAppId && openwrtApps.length) {
      setSelectedApp(openwrtApps[0].id);
    }
  }, [openwrtApps, selectedAppId]);

  if (infoLoading) {
    return <WidgetLoading />;
  }

  if (infoError) {
    return (
      <Stack spacing="xs">
        <Title order={3} align="center">ShadowsocksR</Title>
        <Text align="center" color="red">
          {infoError.message}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack spacing="xs">
      <Title order={3}>ShadowSocksR</Title>
      <ServerSelector appId={selectedAppId ?? ''} value={info?.global.name} servers={info?.servers ?? []} />
      <CheckButton appId={selectedAppId ?? ''} testObject="google" />
      <CheckButton appId={selectedAppId ?? ''} testObject="baidu" />
      <Badge size="xl" color={status === true ? 'green' : 'red'}>
        {statusLoading ? 'Loading...' : (status === true ? 'Running' : 'Stopped')}
      </Badge>
    </Stack>
  );
}

function CheckButton({ appId, testObject }: { appId: string, testObject: 'google' | 'baidu' }) {
  const { name } = useConfigContext();
  const checkMutation = api.openwrtShadowsocksR.check.useMutation();

  return (
    <Tooltip label={`Check ${testObject} connectivity`}>
      <Button
        onClick={() => {
          checkMutation.mutate({
            configName: name ?? '',
            appId: appId,
            testObject: testObject,
          });
        }}
        loading={checkMutation.isLoading}
        fullWidth
        color={testObject === 'google' ? 'blue' : 'red'}
        leftIcon={testObject === 'google' ? <IconBrandGoogle /> : <IconBrandBaidu />}
      >
        {checkMutation.data !== undefined ? (checkMutation.data === true ? 'Success' : 'Failed') : 'Check'}
      </Button>
    </Tooltip>
  );
}

function ServerSelector({ appId, value: initialValue, servers }: {
  appId: string;
  value?: string;
  servers: ShadowsocksRServerType[];
}) {
  const { name } = useConfigContext();
  const [value, setValue] = useState<string | undefined>(initialValue);
  const changeServerMutation = api.openwrtShadowsocksR.changeServer.useMutation();
  const utils = api.useUtils();

  return (
    <Select
      placeholder="Change global server"
      value={value}
      data={servers.map((x) => ({ value: x.name, label: x.alias ?? x.server }))}
      onChange={(value) => {
        if (!value) {
          return;
        }
        changeServerMutation.mutateAsync({
          configName: name ?? '',
          appId: appId,
          serverName: value,
        }, {
          onSuccess: (data) => {
            if (data) {
              setValue(value);
              notifications.show({
                title: 'Global server changed',
                message: 'Global server changed successfully',
                autoClose: true,
                withCloseButton: true,
                color: 'blue',
              });
            } else {
              notifications.show({
                title: 'Global server change failed',
                message: 'Failed to change global server',
                autoClose: true,
                withCloseButton: true,
                color: 'red',
              });
            }
            void utils.openwrtShadowsocksR.status.invalidate();
          },
        });
      }}
    />
  );
}

export default definition;
