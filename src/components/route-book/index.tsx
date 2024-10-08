import { useBook } from '@/fetchers/book';

export function RouteBook() {
  const { data } = useBook('UM', 'GM', 4);
	console.log("TCL: RouteBook -> data", data);

  return <div className='h-[512px]'>holla</div>;
}
