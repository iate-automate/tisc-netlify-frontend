import { useState } from "react";
import { searchBehaviours, type BehaviourSearchResult } from "@/functions/client/resources";
import Button from "@/components/Elements/Buttons/Button";
import "./SearchBehaviours.css";

export default function SearchBar() {
  const [query, setQuery] = useState<string>(""); // Search input state
  const [results, setResults] = useState<BehaviourSearchResult[]>([]); // Search results state
  const [resultsCount, setResultsCount] = useState<number>(0); // Search results count state
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

    return (
        <div className="search">

        <div className="bar__search">
            <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter behaviour e.g. 'Shouting'"
            className="input__search"
            />
            <Button 
              variant="primary"
              label="Search"
              onClick={handleSearch}
              disabled={loading}
              loading={loading}
              className="btn__search"
            />
        </div>

        {/* Error message */}
        {error && <div className="error-message status-negative">{error}</div>}

        {/* Search results */}
        <div className="search-results">
            {(resultsCount > 0) && <p className="results-count status-positive">{resultsCount} matching behaviour{resultsCount > 2 && "s"} found.</p>}
            {(results.length > 0) &&
                <div className="search-results-found cards">
                    {results.map((behaviour, index) => {
                        return (
                            <a 
                                key={behaviour["Record ID"] || `behaviour-${index}`} 
                                href={`/resources/arte/behaviours/${behaviour["Record ID"]}`}
                                className="search-result card card-clickable"
                            >
                                <div className="card-content search-result">
                                    <h3 className="behaviour-name">
                                        {behaviour["Name"] || 'No Name'}
                                    </h3>
                                    {behaviour["Type"] && (
                                        <p className="behaviour-type">{behaviour["Type"]}</p>
                                    )}
                                    {behaviour["Purpose"] && behaviour["Purpose"].length > 0 && (
                                        <p className="behaviour-purpose">
                                            <strong>Purpose:</strong> {behaviour["Purpose"].join(", ")}
                                        </p>
                                    )}
                                </div>
                            </a>
                        );
                    })}
                </div>
            }
        </div>
        </div>
    )

    async function handleSearch(): Promise<void> {
        // Validation guard - check if query is empty or just whitespace
        if (!query || query.trim().length === 0) {
            setError("Please enter a search term");
            return;
        }

        setResults([]);
        setResultsCount(0);
        setLoading(true);
        setError(null);

    try {
        const response = await searchBehaviours(query);
        console.log('Search response:', response);
        
        if (response.success) {
            console.log('Search data:', response.data);
            setResults(response.data || []);
            setResultsCount(response.data?.length || 0);
        } else {
            setError(response.error || "Search failed");
        }
    } catch (err) {
        console.error('Search error:', err);
        setError("An error occurred during the search.");
    } finally {
        setLoading(false);
    }
  };

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent any unintended default action
        handleSearch(); // Trigger the search
    }
  };
}
