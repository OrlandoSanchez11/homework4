const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const glob = require('glob');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Student Server API',
      version: '1.0.0',
    },
  },
  apis: ['studentserver.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Creates a new student object with all of its attributes.
 *     description: Use this endpoint to create a new student.
 *     parameters:
 *       - name: first_name
 *         description: Student's first name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: last_name
 *         description: Student's last name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: gpa
 *         description: Student's GPA
 *         in: formData
 *         required: true
 *         schema:
 *           type: number  // Change type to number
 *       - name: enrolled
 *         description: Student's enrolled status
 *         in: formData
 *         required: true
 *         schema:
 *           type: boolean  // Change type to boolean
 *     responses:
 *       201:
 *         description: Success. The student object has been created.
 *       409:
 *         description: Conflict. The student already exists.
 *       500:
 *         description: Internal Server Error. Unable to create resource.
 */

function saveStudentRecord(filePath, studentData, res) {
  // Check if a student with the same first name and last name exists
  if (checkStudentExists(studentData.first_name, studentData.last_name)) {
    console.log('Student exists');
    return res.status(409).json({ message: 'Conflict. Student already exists' });
  }

  // Write the student data to a JSON file
  fs.writeFile(filePath, JSON.stringify(studentData, null, 2), function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error. Unable to create resource' });
    }

    // Student record saved successfully
    console.log('Student record saved');
    return res.status(201).json({ record_id: studentData.record_id, message: 'Success. Student created successfully' });
  });
}

app.post('/students', function (req, res) {
  // Generate a unique record_id based on the current timestamp
  var record_id = new Date().getTime();

  // Extract student data from the request body
  var studentData = {
    record_id: record_id,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    gpa: req.body.gpa,
    enrolled: req.body.enrolled,
  };

  // Create a file path for the student record
  var filePath = `students/${record_id}.json`;

  // Check if the "students" directory exists; if not, create it
  const dir = 'students';
  fs.access(dir, (err) => {
    if (err) {
      fs.mkdir(dir, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error creating directory' });
        }
        console.log('Directory created successfully!');
        saveStudentRecord(filePath, studentData, res);
      });
    } else {
      // Directory already exists; proceed to save the student record
      saveStudentRecord(filePath, studentData, res);
    }
  });
});



/**
 * @swagger
 * /students/{record_id}:
 *   get:
 *     summary: Get a student by record ID.
 *     description: Use this endpoint to retrieve a student based on their record ID.
 *     parameters:
 *       - name: record_id
 *         description: Student's record ID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success. The student object has been retrieved.
 *       404:
 *         description: Error. The requested resource was not found.
 */
app.get('/students/:record_id', function (req, res) {
  var record_id = req.params.record_id;

  fs.readFile('students/' + record_id + '.json', 'utf-8', function (err, data) {
    if (err) {
      var rsp_obj = {};
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).json(rsp_obj);
    } else {
      return res.status(200).json(data);
    }
  });
});

function readFiles(files, arr, res) {
  fname = files.pop();
  if (!fname) return;
  fs.readFile(fname, 'utf8', function (err, data) {
    if (err) {
      return res.status(500).json({ message: 'error - internal server error' });
    } else {
      arr.push(JSON.parse(data));
      if (files.length == 0) {
        var obj = {};
        obj.students = arr;
        return res.status(200).json(obj);
      } else {
        readFiles(files, arr, res);
      }
    }
  });
}
app.get('/', (req, res) => {
  // Read the HTML file and send it as a response
  fs.readFile('index.html', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading HTML file');
    } else {
      res.send(data);
    }
  });
});

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get an array of all students.
 *     description: Use this endpoint to retrieve an array of all students.
 *     responses:
 *       200:
 *         description: Success. An array of students has been retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       record_id:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       gpa:
 *                         type: number
 *                       enrolled:
 *                         type: boolean  // Change type to boolean
 *       500:
 *         description: Error. Internal server error occurred.
 */

app.get('/students', function (req, res) {
  console.log('get students');
  var obj = {};
  var arr = [];
  filesread = 0;

  glob('students/*.json', null, function (err, files) {
    if (err) {
      return res.status(500).json({ message: 'error - internal server error' });
    }
    readFiles(files, [], res);
  });
});

/**
 * @swagger
 * /students/{record_id}:
 *   put:
 *     summary: Update an existing student by record ID.
 *     description: Use this endpoint to update an existing student based on their record ID.
 *     parameters:
 *       - name: record_id
 *         description: Student's record ID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: first_name
 *         description: Student's first name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: last_name
 *         description: Student's last name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: gpa
 *         description: Student's GPA
 *         in: formData
 *         required: true
 *         schema:
 *           type: number  // Change type to number
 *       - name: enrolled
 *         description: Student's enrolled status
 *         in: formData
 *         required: true
 *         schema:
 *           type: boolean
 *     responses:
 *       204:
 *         description: No content. The student has been updated successfully.
 *       404:
 *         description: Not Found. The requested resource was not found.
 *       400:
 *         description: Bad Request. Unable to update resource.
 */

app.put('/students/:record_id', function (req, res) {
  var record_id = req.params.record_id;
  var fname = 'students/' + record_id + '.json';

  // Check if file exists
  fs.access(fname, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ record_id: record_id, message: 'Not Found. Resource not found' });
    }

    // Extract student data from the request body
    var studentData = {
      record_id: record_id,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gpa: req.body.gpa,
      enrolled: req.body.enrolled,
    };

    // Write the updated student data to the JSON file
    fs.writeFile(fname, JSON.stringify(studentData, null, 2), function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ record_id: record_id, message: 'Bad Request. Unable to update resource' });
      }

      // Student record updated successfully
      console.log('Student record updated');
      return res.status(204).end();
    });
  });
});

/**
 * @swagger
 * /students/{record_id}:
 *   delete:
 *     description: Deletes a student from the student directory by their record ID.
 *     parameters:
 *       - name: record_id
 *         description: Student's Record ID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record deleted.
 *       404:
 *         description: Not Found. Resource not found.
 */
app.delete('/students/:record_id', function (req, res) {
  var record_id = req.params.record_id;
  var fname = 'students/' + record_id + '.json';

  fs.unlink(fname, function (err) {
    var rsp_obj = {};
    if (err) {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'Not Found. Resource not found';
      return res.status(404).json(rsp_obj);
    } else {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'Record deleted';
      return res.status(200).json(rsp_obj);
    }
  });
});

function checkStudentExists(firstName, lastName) {
  console.log('checkStudentExists');
  var files = fs.readdirSync('students');
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (file.endsWith('.json')) {
      let data = JSON.parse(fs.readFileSync('students/' + file, 'utf8'));
      if (data.first_name === firstName && data.last_name === lastName) {
        return true;
      }
    }
  }
  return false;
}

const server=app.listen(3000, '0.0.0.0', function () {
  console.log('Server is running...');
  console.log('Webapp:   http://localhost:5678/');
  console.log('API Docs: http://localhost:5678/api-docs');
});
