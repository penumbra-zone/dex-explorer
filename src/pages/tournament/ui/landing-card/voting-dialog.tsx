import { Dialog } from '@penumbra-zone/ui/dialog';

export const VotingDialog = ({
  isOpen,
  onClose,
  epoch,
}: {
  isOpen: boolean;
  onClose: () => void;
  epoch: number;
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <Dialog.Content title={`Vote in Epoch ${epoch}`}>
        <p>Lorem ipsum</p>
      </Dialog.Content>
    </Dialog>
  );
};
