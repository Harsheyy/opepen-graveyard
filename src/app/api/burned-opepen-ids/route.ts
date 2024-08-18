import { NextResponse } from 'next/server';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const OPEPEN_CONTRACT = '0x6339e5e072086621540d0362c4e3cea0d643e114';
const BURN_ADDRESS = '0x0000000000000000000000000000000000000000';

export async function GET() {
  if (!ETHERSCAN_API_KEY) {
    return NextResponse.json({ error: 'Etherscan API key is not configured' }, { status: 500 });
  }

  const url = `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${OPEPEN_CONTRACT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch data from Etherscan');
    }

    // Filter the transactions to find those sent to the burn address
    const burnedIds = data.result
      .filter(tx => tx.to.toLowerCase() === BURN_ADDRESS.toLowerCase())
      .map(tx => tx.tokenID);

    // Remove duplicates by converting to a Set and back to an array
    const uniqueBurnedIds = [...new Set(burnedIds)];

    return NextResponse.json({ burnedIds: uniqueBurnedIds, total: uniqueBurnedIds.length });
  } catch (error) {
    console.error('Error fetching from Etherscan:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Opepen transfers', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}