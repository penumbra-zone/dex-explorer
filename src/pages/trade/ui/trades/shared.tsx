export const ErrorState = ({ error }: { error: Error }) => {
  return <div className='text-red-500'>{String(error)}</div>;
};

export const formatLocalTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
