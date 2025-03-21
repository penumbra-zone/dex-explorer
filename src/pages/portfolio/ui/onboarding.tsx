import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Image from 'next/image';
import { ExternalLink, Wallet, ShieldCheck, X } from 'lucide-react';
import { Text } from '@penumbra-zone/ui/Text';
import { Card } from '@penumbra-zone/ui/Card';
import { Icon } from '@penumbra-zone/ui/Icon';
import { Button } from '@penumbra-zone/ui/Button';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { PenumbraClient } from '@penumbra-zone/client';
import { connectionStore } from '@/shared/model/connection';
import { useProviderManifests } from '@/shared/api/providerManifests';
import { CosmosConnectButton } from '@/features/cosmos/cosmos-connect-button';
import { useUnifiedAssets } from '../hooks/use-unified-assets';

const dismissedKey = 'veil-portfolio-onboarding-dismissed';
const isPhase2 = false;

const OnboardingCard = ({
  title,
  description,
  footer,
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
}) => {
  return (
    <div className='w-full sm:flex-1 p-4 border border-other-tonalStroke rounded-lg bg-other-tonalFill5'>
      <div className='mb-1'>
        <Text as='div' body color='text.primary'>
          {title}
        </Text>
      </div>
      <div className='mb-10'>
        <Text as='div' body color='text.secondary'>
          {description}
        </Text>
      </div>
      {footer}
    </div>
  );
};

export const Onboarding = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: providerManifests } = useProviderManifests();
  const providerOrigins = useMemo(() => Object.keys(PenumbraClient.getProviders()), []);
  const { isPenumbraConnected, isCosmosConnected } = useUnifiedAssets();
  const [isDismissed, setIsDismissed] = useState(true);

  const onConnectClick = () => {
    if (providerOrigins.length > 1) {
      setIsOpen(true);
    } else if (providerOrigins.length === 1 && providerOrigins[0]) {
      void connectionStore.connect(providerOrigins[0]);
    }
  };

  const dismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(dismissedKey, 'true');
  };

  useEffect(() => {
    const storedValue = localStorage.getItem(dismissedKey);
    setIsDismissed(storedValue === 'true' ? true : false);
  }, []);

  if (isDismissed) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- temporary
  if (isPhase2) {
    return (
      <Card>
        <div className='sm:p-3 p-1'>
          <div className='flex justify-between mb-4'>
            <div className='flex flex-col'>
              <Text xxl color='text.primary'>
                Getting Started with Veil
              </Text>
              <Text body color='text.secondary'>
                To manage your assets, you’ll need to follow a few steps...
              </Text>
            </div>
            <button
              className='w-8 h-8 flex items-center justify-center rounded-full border border-other-tonalStroke'
              onClick={dismiss}
            >
              <Icon IconComponent={X} size='sm' color='text.primary' />
            </button>
          </div>
          <div className='flex flex-wrap gap-2 sm:flex-nowrap'>
            <OnboardingCard
              title='Install & Connect Prax Wallet'
              description='Connect to Veil and gain access to shielded assets and liquidity positions.'
              footer={
                providerOrigins.length === 0 ? (
                  <Button
                    actionType='accent'
                    priority='primary'
                    density='compact'
                    icon={ExternalLink}
                    onClick={() => {
                      window.open('https://praxwallet.com/', '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Install
                  </Button>
                ) : (
                  <>
                    {!isPenumbraConnected ? (
                      <Button
                        actionType='accent'
                        priority='primary'
                        density='compact'
                        icon={Wallet}
                        onClick={onConnectClick}
                      >
                        Connect
                      </Button>
                    ) : (
                      <div className='flex items-center gap-1 h-8'>
                        <Icon IconComponent={ShieldCheck} size='sm' color='primary.light' />
                        <Text color='primary.light' small>
                          Connected
                        </Text>
                      </div>
                    )}
                  </>
                )
              }
            />
            <OnboardingCard
              title='Connect Cosmos Wallet'
              description='Connect to Veil and manage public assets and shield them in Penumbra.'
              footer={
                !isCosmosConnected ? (
                  <CosmosConnectButton variant='minimal' actionType='unshield'>
                    Connect
                  </CosmosConnectButton>
                ) : (
                  <div className='flex items-center gap-1 h-8'>
                    <Icon IconComponent={ShieldCheck} size='sm' color='unshield.light' />
                    <Text color='unshield.light' small>
                      Connected
                    </Text>
                  </div>
                )
              }
            />
            <OnboardingCard
              title='Shield Your Assets'
              description='With a Cosmos Wallet connected, shield your public assets into Penumbra directly from the assets table below.'
            />
          </div>
        </div>
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Dialog.Content title='Choose wallet'>
            <Dialog.RadioGroup>
              <div className='flex flex-col gap-2 pt-1'>
                {Object.entries(providerManifests ?? {}).map(([key, manifest]) => (
                  <Dialog.RadioItem
                    key={key}
                    value={key}
                    title={<Text color='text.primary'>{manifest.name}</Text>}
                    description={
                      <Text detail color='text.secondary'>
                        {manifest.description}
                      </Text>
                    }
                    startAdornment={
                      <Image
                        height={32}
                        width={32}
                        src={URL.createObjectURL(manifest.icons['128'])}
                        alt={manifest.name}
                      />
                    }
                    onSelect={() => void connectionStore.connect(key)}
                  />
                ))}
              </div>
            </Dialog.RadioGroup>
          </Dialog.Content>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card>
      <div className='sm:p-3 p-1'>
        <div className='flex justify-between mb-4'>
          <div className='flex flex-col'>
            <Text xxl color='text.primary'>
              Getting Started with Veil
            </Text>
            <Text body color='text.secondary'>
              To manage your assets, you’ll need to follow a few steps...
            </Text>
          </div>
          <button
            className='w-8 h-8 flex items-center justify-center rounded-full border border-other-tonalStroke'
            onClick={dismiss}
          >
            <Icon IconComponent={X} size='sm' color='text.primary' />
          </button>
        </div>
        <div className='flex flex-wrap gap-2 sm:flex-nowrap'>
          <OnboardingCard
            title='Install Prax Wallet'
            description='Create a new wallet to begin interacting with the Penumbra blockchain. '
            footer={
              providerOrigins.length === 0 ? (
                <Button
                  actionType='accent'
                  priority='primary'
                  density='compact'
                  icon={ExternalLink}
                  onClick={() => {
                    window.open('https://praxwallet.com/', '_blank', 'noopener,noreferrer');
                  }}
                >
                  Install
                </Button>
              ) : (
                <div className='flex items-center gap-1 h-8'>
                  <Icon IconComponent={ShieldCheck} size='sm' color='primary.light' />
                  <Text color='primary.light' small>
                    Installed
                  </Text>
                </div>
              )
            }
          />
          <OnboardingCard
            title='Connect Prax Wallet'
            description='Connect to Veil and gain access to shielded assets and liquidity positions.'
            footer={
              !isPenumbraConnected ? (
                <Button
                  actionType='accent'
                  priority='primary'
                  density='compact'
                  icon={Wallet}
                  onClick={onConnectClick}
                >
                  Connect
                </Button>
              ) : (
                <div className='flex items-center gap-1 h-8'>
                  <Icon IconComponent={ShieldCheck} size='sm' color='primary.light' />
                  <Text color='primary.light' small>
                    Connected
                  </Text>
                </div>
              )
            }
          />
          <OnboardingCard
            title='Shield Your Assets'
            description='Shield your public assets into Penumbra and begin trading privately.'
            footer={
              <Button
                actionType='accent'
                priority='primary'
                density='compact'
                icon={ExternalLink}
                onClick={() => {
                  window.open(
                    'https://app.penumbra.zone/#/deposit/skip',
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
              >
                Go to App
              </Button>
            }
          />
        </div>
      </div>
    </Card>
  );
});
