import { deserialize, Serialized } from './serializer';

/**
 * A wrapper around `fetch` to request data from local endpoints. Features:
 * 1. Composes the URL search params correctly, only provide an object
 * 2. Throws if the response contains an error object
 * 3. Deserializes the response object, if it contains protobuf messages
 */
export const apiFetch = async <RES extends object>(
  url: string,
  searchParams: Record<string, string | number> = {},
): Promise<RES> => {
  // cast numbers and other search param types to string
  const params = Object.entries(searchParams).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (typeof value === 'undefined') {
        return acc;
      }
      if (typeof value !== 'string') {
        acc[key] = value.toString();
      }
      return acc;
    },
    {},
  );

  const urlParams = new URLSearchParams(params).toString();
  const fetchRes = await fetch(`${url}${urlParams && `?${urlParams}`}`);

  const jsonRes = (await fetchRes.json()) as Serialized<RES | { error: string }>;

  if (typeof jsonRes === 'object' && 'error' in jsonRes) {
    throw new Error(jsonRes.error);
  }

  if (Array.isArray(jsonRes)) {
    return jsonRes.map(deserialize) as RES;
  }

  return deserialize(jsonRes);
};
