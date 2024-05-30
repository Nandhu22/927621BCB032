const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;
const windowSize = 10;

let numberWindow = [1, 2, 4, 5];

const isPrime = (num) => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
};

const isFibonacci = (num) => {
    const isPerfectSquare = (x) => Math.sqrt(x) % 1 === 0;
    return isPerfectSquare(5 * num * num + 4) || isPerfectSquare(5 * num * num - 4);
};

const fetchNumbers = async (numberid) => {
    try {
        const response = await axios.get('https://api.thirdpartyserver.com/numbers', { timeout: 500 });
        return response.data.numbers.filter((num) => {
            if (numberid === 'p') return isPrime(num);
            if (numberid === 'f') return isFibonacci(num);
            if (numberid === 'e') return num % 2 === 0;
            if (numberid === 'r') return true;
        });
    } catch (error) {
        console.error('error in fetching the result numbers:', error);
        return [];
    }
};

const calculateAverage = (numbers) => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return (sum / numbers.length).toFixed(2);
};

app.get('/numbers/:numberid', async (req, res) => {
    const numberid = req.params.numberid;

    if (!['p', 'f', 'e', 'r'].includes(numberid)) {
        return res.status(400).send('Invalid number');
    }

    const windowPrevState = [...numberWindow];

    const newNumbers = await fetchNumbers(numberid);

    newNumbers.forEach(num => {
        if (!numberWindow.includes(num)) {
            if (numberWindow.length >= windowSize) {
                numberWindow.shift();
            }
            numberWindow.push(num);
        }
    });

    const avg = calculateAverage(numberWindow);

    const response = {
        windowPrevState,
        windowCurrState: [...numberWindow],
        numbers: newNumbers,
        avg
    };

    res.json(response);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
