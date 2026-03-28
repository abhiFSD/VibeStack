import React, { useState, useEffect } from 'react';
import { Container, Button, Alert, ListGroup } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';

const DataCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const tables = [
    { name: 'SubSection', listQuery: queries.listSubSections, deleteQuery: mutations.deleteSubSection },
    { name: 'Section', listQuery: queries.listSections, deleteQuery: mutations.deleteSection },
    { name: 'Chapter', listQuery: queries.listChapters, deleteQuery: mutations.deleteChapter },
    { name: 'Learning', listQuery: queries.listLearnings, deleteQuery: mutations.deleteLearning },
    { name: 'Post', listQuery: queries.listPosts, deleteQuery: mutations.deletePost }
  ];

  const cleanTable = async (table) => {
    try {
      const response = await API.graphql({ query: table.listQuery });
      const items = response.data[`list${table.name}s`].items;
      
      for (const item of items) {
        await API.graphql({
          query: table.deleteQuery,
          variables: { input: { id: item.id } }
        });
        setResults(prev => [...prev, `Deleted ${table.name} - ${item.id}`]);
      }
      
      return `Cleaned ${items.length} items from ${table.name}`;
    } catch (err) {
      throw new Error(`Error cleaning ${table.name}: ${err.message}`);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Are you sure you want to delete all data? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Clean tables in order (children first, then parents)
      for (const table of tables) {
        const result = await cleanTable(table);
        setResults(prev => [...prev, result]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h2>Data Cleanup Utility</h2>
      
      <Button 
        variant="danger" 
        onClick={handleCleanup} 
        disabled={loading}
        className="mb-3"
      >
        {loading ? 'Cleaning...' : 'Clean All Data'}
      </Button>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <ListGroup>
          {results.map((result, index) => (
            <ListGroup.Item key={index}>{result}</ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
};

export default DataCleanup; 