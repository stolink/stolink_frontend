import { useEffect, useState } from "react";
import { characterService } from "@/services/characterService";
import type { SimpleCharacter } from "@/types/character";

const CharacterIntegrationTest = () => {
  const [characters, setCharacters] = useState<SimpleCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await characterService.fetchSimpleCharacters();
        setCharacters(data);
      } catch (error) {
        console.error("Failed to fetch characters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6 text-purple-400">
        Character Data Integration Test
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {characters.map((char, index) => (
          <div
            key={index}
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-lg hover:border-purple-500/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">{char.name}</h2>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm border border-purple-500/20">
                {char.role}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Relationships
              </h3>
              {char.relationships.length > 0 ? (
                <ul className="space-y-2">
                  {char.relationships.map((rel, rIndex) => (
                    <li
                      key={rIndex}
                      className="flex items-center justify-between text-sm bg-[#222] p-2 rounded border border-gray-800"
                    >
                      <span className="text-gray-300">
                        {rel.targetCharacterName}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
                        {rel.type}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic text-sm">
                  No relationships found
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800  text-xs overflow-auto">
        <h3 className="mb-2 text-gray-500">Raw Data Response:</h3>
        <pre className="text-green-400">
          {JSON.stringify(characters, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default CharacterIntegrationTest;
