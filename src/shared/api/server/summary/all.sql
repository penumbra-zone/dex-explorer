select candles.candles, summary.* from (
    select distinct on (
        least(asset_start, asset_end),
        greatest(asset_start, asset_end)
    ) *
    from "dex_ex_pairs_summary"
    where price != 0 and the_window = '1d'
    limit 15
    offset 0
) as "summary"

inner join (
    select asset_end, asset_start, ARRAY_AGG(close ORDER BY start_time ASC) AS candles
    from dex_ex_price_charts
    where the_window = '1h' and start_time > NOW() - INTERVAL '24 hours'
    group by asset_end, asset_start
) as "candles"

on "candles"."asset_start" = "summary"."asset_start"
    and "candles"."asset_end" = "summary"."asset_end"
order by "trades_over_window" desc
