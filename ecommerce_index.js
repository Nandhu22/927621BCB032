const express = require('express');
const axios = require('axios');
const app = express();

const ECOMMERCE_API_URL = 'http://ecommerce-test-server.com/api';
let registeredCompanies = [];

async function registerCompanies() {
    try {
        const response = await axios.post(`${ECOMMERCE_API_URL}/register`);
        registeredCompanies = response.data.companies;
    } catch (error) {
        console.error('Error registering companies:', error.message);
        throw new Error('Failed to register companies');
    }
}

registerCompanies().catch(error => {
    console.error(error.message);
    process.exit(1);
});

async function fetchProducts(category) {
    const productPromises = registeredCompanies.map(company =>
        axios.get(`${ECOMMERCE_API_URL}/${company}/categories/${category}/products`)
    );

    const productResponses = await Promise.all(productPromises);
    let products = [];
    productResponses.forEach(response => {
        products = products.concat(response.data.products);
    });
    return products;
}

function generateUniqueId(product, index) {
    return `${product.company}-${product.id}-${index}`;
}

app.use((err, req, res, next) => {
    console.error('An error occurred:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.get('/categories/:category/products', async (req, res, next) => {
    const { category } = req.params;
    const { n = 10, page = 1, sort_by, order = 'asc' } = req.query;

    try {
        let products = await fetchProducts(category);

        if (sort_by) {
            products.sort((a, b) => {
                if (order === 'asc') {
                    return a[sort_by] - b[sort_by];
                } else {
                    return b[sort_by] - a[sort_by];
                }
            });
        }

        products = products.map((product, index) => ({
            ...product,
            unique_id: generateUniqueId(product, index)
        }));

        const start = (page - 1) * n;
        const end = start + parseInt(n);
        const paginatedProducts = products.slice(start, end);

        res.json({ products: paginatedProducts });
    } catch (error) {
        next(error);
    }
});

app.get('/categories/:category/products/:productid', async (req, res, next) => {
    const { category, productid } = req.params;

    try {
        const products = await fetchProducts(category);
        const product = products.find(prod => generateUniqueId(prod, products.indexOf(prod)) === productid);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        next(error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
