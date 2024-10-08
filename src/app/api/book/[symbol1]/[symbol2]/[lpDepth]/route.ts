interface QueryParams {
  symbol1: string;
  symbol2: string;
  lpDepth: string;
}

export async function GET(request, { params }) {
  const { symbol1, symbol2, lpDepth } = params as QueryParams;

  // const users = await getUsersFromDatabase();  // Replace with actual logic
  return new Response(JSON.stringify({
    hello: true,
  }), { status: 200 });
}