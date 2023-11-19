const bodyParser = require('body-parser');
const express = require('express');
const mysql = require('mysql2');
const ejs = require('ejs'); // Import the EJS package

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs'); // Set EJS as the view engine

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'etd_user',
  password: 'etd_user',
  database: 'db_etd',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

app.get('/', (req, res) => {
  const query = 'SELECT * FROM etd_metadata';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error);
      return;
    }

    // Pass the data to the view (index.ejs)
     res.render('index', { data: results });
  });
});

// New route to handle the search form submission
app.post('/search', (req, res) => {
  const searchQuery = req.body.search; // Get the search term from the form

  // Modify the SQL query to filter results based on the search term across multiple fields
  const query = 'SELECT * FROM etd_metadata WHERE ' +
    'title LIKE ? OR creator LIKE ? OR description LIKE ? OR publisher LIKE ?';

  const searchTerm = `%${searchQuery}%`;

  connection.query(query, [searchTerm, searchTerm, searchTerm, searchTerm], (error, results) => {
    if (error) {
      console.error('Error executing search query: ' + error);
      return;
    }

    // Pass the search results to the view
    res.render('index', { data: results });
  });
});

// Add a new route to handle preprocessing
app.get('/preprocess/:id', (req, res) => {
  const recordId = req.params.id;

  // Retrieve the record from the database based on the ID
  const query = 'SELECT * FROM etd_metadata WHERE id = ?';
  connection.query(query, [recordId], (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    const record = results[0];

    // Perform the preprocessing
    const preprocessedTitle = record.title.toLowerCase();
    const preprocessedCreator = record.creator.replace(',', ''); // Remove comma
    const preprocessedPublisher = 'The University of Zambia';

    // Update the database with the preprocessed data
    const updateQuery = 'UPDATE etd_metadata SET title = ?, creator = ?, publisher = ? WHERE id = ?';
    connection.query(updateQuery, [preprocessedTitle, preprocessedCreator, preprocessedPublisher, recordId], (error) => {
      if (error) {
        console.error('Error updating record: ' + error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Send the preprocessed data as JSON response
      res.json([{ title: preprocessedTitle, creator: preprocessedCreator, publisher: preprocessedPublisher }]);
    });
  });
});


app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
