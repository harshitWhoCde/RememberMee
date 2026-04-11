import { useState, useEffect } from 'react';

export default function VisitorArchive() {
  // 1. Setup State for our data
  const [memories, setMemories] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorRelation, setNewVisitorRelation] = useState('');

  // 2. Fetch data from your backend when the page loads
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/memories');
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          setMemories(data.data);
          // Automatically select the most recent visitor to show on the right side
          setSelectedVisitor(data.data[0].name);
        }
      } catch (error) {
        console.error("Failed to fetch memories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, []);

  // 3. Process the data: Get a list of UNIQUE visitors for the left column
  const uniqueVisitorsMap = new Map();
  memories.forEach(memory => {
    // We use lowercase to avoid duplicates like "Rahul" and "rahul"
    const nameKey = memory.name.toLowerCase();
    if (!uniqueVisitorsMap.has(nameKey)) {
      uniqueVisitorsMap.set(nameKey, {
        name: memory.name,
        relation: memory.relation
      });
    }
  });
  const uniqueVisitors = Array.from(uniqueVisitorsMap.values());

  // 4. Process the data: Get the timeline events ONLY for the selected visitor
  const selectedMemories = memories.filter(
    m => m.name.toLowerCase() === selectedVisitor?.toLowerCase()
  );

  // Helper function to format the database date
  const formatDate = (dateString) => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return <div className="px-12 py-10 text-2xl text-slate-500">Loading memories...</div>;
  }

  return (
    <div className="px-12 flex gap-12 min-h-full">
      {/* Left Column: Visitor Directory */}
      <section className="w-2/5 space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-bold font-headline text-on-surface-variant">
            Recent Visitors
          </h3>

          {/* ➕ ADD BUTTON */}
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary/90"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <div className="space-y-4">

          {uniqueVisitors.length === 0 && (
            <p className="text-slate-500 italic px-2">No visitors recorded yet.</p>
          )}

          {/* Map through our unique visitors to create the cards dynamically */}
          {uniqueVisitors.map((visitor, index) => {
            const isActive = selectedVisitor?.toLowerCase() === visitor.name.toLowerCase();

            return (
              <div
                key={index}
                onClick={() => setSelectedVisitor(visitor.name)}
                className={`p-6 rounded-lg flex items-center gap-6 cursor-pointer transition-colors ${isActive
                  ? "bg-surface-container-lowest shadow-xl shadow-blue-900/5 ring-4 ring-primary/10"
                  : "bg-surface-container-low hover:bg-surface-container"
                  }`}
              >
                {/* Dynamically generated profile picture based on their name */}
                <img
                  alt={`${visitor.name} Profile`}
                  className={`w-20 h-20 rounded-full object-cover ${isActive ? "" : "grayscale opacity-80"}`}
                  src={`https://ui-avatars.com/api/?name=${visitor.name}&background=random&size=128`}
                />
                <div>
                  <p className={`text-2xl font-bold ${isActive ? "text-on-surface" : "text-on-surface opacity-80 capitalize"}`}>
                    {visitor.name}
                  </p>
                  <p className={`${isActive ? "text-primary" : "text-on-surface-variant"} font-medium text-lg capitalize`}>
                    {visitor.relation}
                  </p>
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <span className="material-symbols-outlined text-primary text-3xl">chevron_right</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Right Column: Memory Timeline */}
      <section className="w-3/5">
        <div className="bg-surface-container-lowest p-10 rounded-lg shadow-xl shadow-blue-900/5 min-h-[716px]">
          {selectedVisitor ? (
            <>
              <h3 className="text-3xl font-bold font-headline text-primary mb-12 capitalize">
                Conversations with {selectedVisitor}
              </h3>

              <div className="relative space-y-12">
                {/* Timeline Line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-1 bg-surface-container-highest rounded-full"></div>

                {selectedMemories.map((memory, index) => (
                  <div key={memory._id} className="relative pl-12">
                    {/* Make the most recent event stand out with a primary color dot */}
                    <div className={`absolute left-0 top-2 w-6 h-6 rounded-full ring-4 ring-white shadow-sm z-10 ${index === 0 ? "bg-primary" : "bg-slate-300"}`}></div>
                    <div className="space-y-2">
                      <time className="text-xl font-bold text-on-surface">{formatDate(memory.createdAt)}</time>
                      <div className={`p-6 rounded-lg ${index === 0 ? "bg-slate-100 border-l-8 border-primary" : "bg-slate-50 opacity-80"}`}>
                        <p className="text-xl leading-relaxed text-slate-700 capitalize">
                          "{memory.event}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-2xl text-slate-400">Select a visitor to view their timeline.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
