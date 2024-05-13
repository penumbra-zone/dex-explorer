// components/lpSearchBar.tsx

import React, { useState } from "react";
import { Input } from "@chakra-ui/react";


export const LPSearchBar = () => {

    const [LpId, setLpId] = useState("");

    return (
        <form onSubmit={e=> {
            e.preventDefault();
            const sanitizedId = sanitizeInput(LpId)
            location.assign("/lp/" + sanitizedId)
        }}>
        <Input
            placeholder="Search by Liquidity Position ID"
            width={"30em"}
            value={LpId}
            onChange={(e) => setLpId(e.target.value)}
        />
        </form>
    )
}

const sanitizeInput = (input: string): string => {
    // Trivial sanitation now, should replace with regex for lpId
    return input.replaceAll(/[&/\\#,+()$~%.^'":*?<>{} ]/g, "");
}
