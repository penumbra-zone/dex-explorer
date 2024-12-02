select
    "summary"."asset_start",
    "summary"."asset_end",
    "summary"."price",
    "summary"."price_then",
    "summary"."the_window",
    "summary"."direct_volume_over_window",
    "summary"."swap_volume_over_window",
    "summary"."liquidity",
    "summary"."liquidity_then",
    "summary"."trades_over_window",
    "summary"."low",
    "summary"."high",
    "candles"."candles",
    "candles"."candle_times"
from (
    select distinct on (
        least(asset_start, asset_end),
        greatest(asset_start, asset_end)
    ) *
    from "dex_ex_pairs_summary"
    where (
        "the_window" = '1d' and
        "price" != 0 and
        "asset_start" not in (
            -- USDT, USDC, USDY
            decode('76B3E4B10681358C123B381F90638476B7789040E47802DE879F0FB3EEDC8D0B', 'hex'),
            decode('BF8B035DDA339B6CDA8F221E79773B0FD871F27A472920F84C4AA2B4F98A700D', 'hex'),
            decode('CC0D3C9EEF0C7FF4E225ECA85A3094603691D289AEAF428AB0D87319AD93A302', 'hex')
        )
    )
) as "summary"

inner join (
    select
        "asset_end",
        "asset_start",
        array_agg("close" ORDER BY start_time ASC) as "candles",
        array_agg("start_time" ORDER BY start_time ASC) as "candle_times"
    from "dex_ex_price_charts"
    where (
        "the_window" = '1h' and
        -- TODO: change to the latest 24h instead of the 3 days ago
        "start_time" > NOW() - INTERVAL '96 hours' and
        "start_time" <= NOW() - INTERVAL '72 hours'
    )
    group by "asset_start", "asset_end"
) as "candles"

on
    "candles"."asset_start" = "summary"."asset_start" and
    "candles"."asset_end" = "summary"."asset_end"
order by "trades_over_window" desc
limit 15
offset 0;
