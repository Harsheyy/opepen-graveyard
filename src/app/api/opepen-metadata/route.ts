import { NextResponse } from 'next/server';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const CONTRACT_ADDRESS = '0x6339e5e072086621540d0362c4e3cea0d643e114';
const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const MAX_BATCH_SIZE = 100; // Alchemy's maximum batch size
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchNFTMetadata(tokenIds: string[]) {
  const result: any = {};

  for (let i = 0; i < tokenIds.length; i += MAX_BATCH_SIZE) {
    const batch = tokenIds.slice(i, i + MAX_BATCH_SIZE);

    try {
      const response = await fetch(
        `${ALCHEMY_URL}/getNFTMetadataBatch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: batch.map(id => ({ contractAddress: CONTRACT_ADDRESS, tokenId: id }))
          }),
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch metadata batch: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Unexpected response structure from Alchemy API');
        continue;
      }

      for (const nft of data) {
        if (nft.id && nft.id.tokenId) {
          result[nft.id.tokenId] = nft;
        } else {
          console.log(`Incomplete data for NFT:`, JSON.stringify(nft, null, 2));
        }
      }

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Error fetching metadata batch:`, error);
    }
  }

  return result;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenIds = url.searchParams.get('ids')?.split(',') || [];

  if (tokenIds.length === 0) {
    return NextResponse.json({ error: 'Token IDs are required' }, { status: 400 });
  }

  try {
    const metadata = await fetchNFTMetadata(tokenIds);
    
    if (Object.keys(metadata).length === 0) {
      return NextResponse.json({ error: 'No metadata available for the requested token IDs' }, { status: 404 });
    }
    
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}