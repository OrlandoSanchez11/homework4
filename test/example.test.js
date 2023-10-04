const request = require('supertest');
const {
    app,
    server
} = require('../studentserver');

// Test Fixtures
const baseURL = "http://localhost:3000";
const data = {
    enrolled: "true",
    first_name: "James",
    gpa: "3",
    last_name: "Beam",
};

afterAll((done) => {
    server.close(() => {
        done();
    });
});

describe('GET /students', () => {
    var response;

    beforeAll(async () => {
        response = await request(baseURL).get('/students');
    });

    it('should return a 200 status', async () => {
        expect(response.status).toBe(200);
    });

    it('should return a list of students', async () => {
        expect(response.body).toEqual({
            students: [{
                enrolled: "true",
                first_name: 'Jim',
                gpa: "3",
                last_name: 'Beam',
                record_id: 1677444963727
            },
            {
                enrolled: "false",
                first_name: 'Janet',
                gpa: '5.0',
                last_name: 'Doe',
                record_id: 1677444956126
            },
            {
                enrolled: "true",
                first_name: "John",
                gpa: "3",
                last_name: 'Doe',
                record_id: 1677444950300
            }
            ]
        });
    });
});

describe('GET /students/{record_id}', () => {
    var response;

    beforeAll(async () => {
        response = await request(baseURL).get('/students/1677444950300');
    });

    it('should return a 200 status', async () => {
        expect(response.status).toBe(200);
    });

    it('should return a specific student', async () => {
        expect(response.body).toEqual({
            "record_id": 1677444950300,
            "first_name": "John",
            "last_name": "Doe",
            "gpa": "3",
            "enrolled": "true"
        });
    });
});

describe('POST /students', () => {
    var response;

    beforeAll(async () => {
        response = await request(baseURL).post('/students').send(data);
    });

    it('Should return 201', async () => {
        expect(response.status).toBe(201);
    });

    it('Should have message, and record_id', async () => {
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('record_id');
    });

    afterAll(async () => {
        // Clean up the newly created student
        let student = response.body['record_id'];
        await request(baseURL).delete(`/students/${student}`);
    });
});

describe('POST /students', () => {
    it('Should return 409 for duplicate student', async () => {
        // Attempt to create a duplicate student
        const response = await request(baseURL).post('/students').send({
            enrolled: "true",
            first_name: 'Jim',
            gpa: "3",
            last_name: 'Beam',
        });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message', 'Conflict. Student already exists');
    });
});

describe('PUT /students/{record_id}', () => {
    it('Should return 204 for successful update', async () => {
        const response = await request(baseURL).put('/students/1677444950300').send(data);

        expect(response.status).toBe(204);
    });

    it('Should return 400 for unable to update student', async () => {
        const response = await request(baseURL).put('/students/1677444950300').send({
            invalid_field: 'invalid',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Bad Request. Unable to update resource');
    });

    it('Should return 404 for non-existing student', async () => {
        const response = await request(baseURL).put('/students/non_existing_record_id').send(data);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Not Found. Resource not found');
    });
});

describe('DELETE /students/{record_id}', () => {
    it('Should return 200 for successful deletion', async () => {
        const response = await request(baseURL).delete('/students/1677444950300');

        expect(response.status).toBe(200);
    });

    it('Should return 404 for non-existing student', async () => {
        const response = await request(baseURL).delete('/students/non_existing_record_id');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Not Found. Resource not found');
    });
});
