'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Database, RefreshCw, Copy, CheckCircle } from 'lucide-react';

interface CollectionData {
  name: string;
  documents: any[];
  error?: string;
}

export default function FirebaseDataPage() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string>('');
  const { user } = useAuth();

  const collectionNames = ['users', 'ovens', 'bookings'];

  const loadAllData = async () => {
    setLoading(true);
    const allCollections: CollectionData[] = [];

    for (const collectionName of collectionNames) {
      try {
        console.log(`📊 Loading ${collectionName} collection...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        allCollections.push({
          name: collectionName,
          documents: documents
        });

        console.log(`✅ ${collectionName}: ${documents.length} documents`);
        
        // Log the first document structure for each collection
        if (documents.length > 0) {
          console.log(`🔍 Sample ${collectionName} document structure:`, Object.keys(documents[0]));
        }
      } catch (error) {
        console.error(`❌ Error loading ${collectionName}:`, error);
        allCollections.push({
          name: collectionName,
          documents: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setCollections(allCollections);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.log('Copy failed, using fallback method');
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      if (value.toDate && typeof value.toDate === 'function') {
        try {
          return value.toDate().toLocaleString();
        } catch {
          return 'Invalid Timestamp';
        }
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading Firebase data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Database className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Firebase Data Structure</h1>
              <p className="text-gray-600">Inspect your Firestore collections and field names</p>
            </div>
          </div>
          
          <button
            onClick={loadAllData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>

        <div className="space-y-8">
          {collections.map((coll) => (
            <div key={coll.name} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Collection: {coll.name}
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {coll.documents.length} documents
                  </span>
                </div>
                {coll.error && (
                  <p className="text-red-600 text-sm mt-2">Error: {coll.error}</p>
                )}
              </div>
              
              <div className="p-6">
                {coll.documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No documents found</p>
                ) : (
                  <div className="space-y-6">
                    {/* Field Names Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Available Fields:</h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(
                          coll.documents.flatMap(doc => Object.keys(doc))
                        )).map(field => (
                          <span 
                            key={field} 
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sample Documents */}
                    {coll.documents.slice(0, 3).map((doc, index) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">
                            Document {index + 1}: {doc.id}
                          </h4>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(doc, null, 2), `${coll.name}-${doc.id}`)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            {copiedField === `${coll.name}-${doc.id}` ? (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <Copy className="h-4 w-4 mr-1" />
                            )}
                            {copiedField === `${coll.name}-${doc.id}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(doc).map(([key, value]) => (
                            <div key={key} className="bg-white p-3 rounded border">
                              <div className="font-medium text-gray-700 text-sm mb-1">
                                {key}:
                              </div>
                              <div className="text-gray-600 text-sm break-all">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {formatValue(value)}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {coll.documents.length > 3 && (
                      <p className="text-gray-500 text-center text-sm">
                        ... and {coll.documents.length - 3} more documents
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Code Generation Helper */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Code Generation Helper</h3>
          <div className="space-y-4">
            {collections.map((coll) => {
              if (coll.documents.length === 0) return null;
              
              const sampleDoc = coll.documents[0];
              const fields = Object.keys(sampleDoc);
              
              return (
                <div key={coll.name} className="border border-gray-200 rounded p-4">
                  <h4 className="font-medium text-gray-800 mb-2">{coll.name} Interface:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`interface ${coll.name.charAt(0).toUpperCase() + coll.name.slice(1, -1)} {
  id: string;
${fields.filter(f => f !== 'id').map(field => {
  const value = sampleDoc[field];
  let type = 'any';
  
  if (typeof value === 'string') type = 'string';
  else if (typeof value === 'number') type = 'number';
  else if (typeof value === 'boolean') type = 'boolean';
  else if (value && value.toDate) type = 'Date';
  else if (Array.isArray(value)) type = 'any[]';
  
  return `  ${field}: ${type};`;
}).join('\n')}
}`}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
