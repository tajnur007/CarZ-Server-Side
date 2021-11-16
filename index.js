const express = require('express');
const app = express();
const port = process.env.PORT || 7007;

app.get('/', (req, res) => {
    res.send('CarZ Server Running....');
});

app.listen(port, () => {
    console.log('Server running on port:', port);
});