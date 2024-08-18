'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Attribute {
  trait_type: string;
  value: string | number;
}

interface Opepen {
  tokenId: string;
  name: string;
  image: string;
  attributes: Attribute[];
}

interface GroupedOpepens {
  [key: string]: {
    opepens: Opepen[];
    setName: string;
  };
}

const Header = ({ burnedCount }: { burnedCount: number }) => {
  const percentage = ((burnedCount / 16000) * 100).toFixed(2);
  
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Opepen Graveyard</h1>
        <p className="text-sm">
          {burnedCount.toLocaleString()} / 16,000 ({percentage}%)
        </p>
      </div>
    </header>
  );
};

const OpepenCard = ({ opepen }: { opepen: Opepen }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img 
        src={opepen.image} 
        alt={opepen.name} 
        className="w-full h-40 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
        }}
      />
      <div className="p-2 text-center">
        <p className="text-xs text-gray-600 truncate">{opepen.name}</p>
      </div>
    </div>
  );
};

const OpepenList = () => {
  const [opepens, setOpepens] = useState<Opepen[]>([]);
  const [burnedIds, setBurnedIds] = useState<string[]>([]);
  const [totalBurned, setTotalBurned] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBurnedIds = useCallback(async () => {
    try {
      const response = await fetch('/api/burned-opepen-ids');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch burned Opepen IDs');
      }

      setBurnedIds(data.burnedIds || []);
      setTotalBurned(data.total || 0);
      return data.burnedIds || [];
    } catch (error) {
      console.error('Error fetching burned IDs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch burned IDs');
      return [];
    }
  }, []);

  const fetchOpepensMetadata = useCallback(async (ids: string[]) => {
    try {
      const response = await fetch(`/api/opepen-metadata?ids=${ids.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }
      const data = await response.json();
      return Object.entries(data).map(([tokenId, metadata]: [string, any]) => ({
        tokenId,
        name: metadata.metadata?.name || `Opepen #${tokenId}`,
        image: metadata.media?.[0]?.gateway || '',
        attributes: metadata.metadata?.attributes || []
      }));
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch metadata');
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const ids = await fetchBurnedIds();
        if (ids && ids.length > 0) {
          const metadata = await fetchOpepensMetadata(ids);
          setOpepens(metadata);
        } else {
          setError('No burned Opepen IDs found');
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchBurnedIds, fetchOpepensMetadata]);

  const groupedOpepens = opepens.reduce((groups, opepen) => {
    const isRevealed = opepen.attributes.find(attr => attr.trait_type === "Revealed")?.value === "Yes";
    const release = opepen.name.split(',')[0].split(' ')[1]; // Extract release number from name
    const setName = opepen.attributes.find(attr => attr.trait_type === "Set")?.value as string || "Unknown";
    
    if (!isRevealed) {
      if (!groups.Unrevealed) groups.Unrevealed = { opepens: [], setName: "Unrevealed" };
      groups.Unrevealed.opepens.push(opepen);
    } else if (release) {
      const key = `Set ${release}`;
      if (!groups[key]) groups[key] = { opepens: [], setName };
      groups[key].opepens.push(opepen);
    } else {
      if (!groups.Other) groups.Other = { opepens: [], setName: "Other" };
      groups.Other.opepens.push(opepen);
    }
    
    return groups;
  }, {} as GroupedOpepens);

  const sortedGroups = Object.entries(groupedOpepens).sort(([aKey], [bKey]) => {
    if (aKey === "Unrevealed") return -1;
    if (bKey === "Unrevealed") return 1;
    if (aKey.startsWith("Set") && bKey.startsWith("Set")) {
      return parseInt(aKey.split(' ')[1]) - parseInt(bKey.split(' ')[1]);
    }
    return aKey.localeCompare(bKey);
  });

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  
  return (
    <>
      <Header burnedCount={totalBurned} />
      <div className="w-full pt-20 pb-8 px-6 bg-gray-100 min-h-screen">
        {error && <p className="text-red-500 mb-4 px-4">Error: {error}</p>}
        
        {opepens.length > 0 ? (
          <div className="space-y-4 px-4">
            {sortedGroups.map(([groupName, group]) => (
              <div key={groupName} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={groupName}>
                    <AccordionTrigger className="px-4 py-2 text-xl font-bold hover:bg-gray-50">
                      {groupName === "Unrevealed" 
                        ? `Unrevealed (${group.opepens.length})`
                        : `${groupName} - ${group.setName} (${group.opepens.length})`
                      }
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                        {group.opepens.map((opepen) => (
                          <OpepenCard key={opepen.tokenId} opepen={opepen} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4">No Opepen metadata available. This could be due to an error or because no tokens have been burned.</p>
        )}
      </div>
    </>
  );
};

export default OpepenList;