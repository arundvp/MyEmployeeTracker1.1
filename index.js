// Import and require packages
const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const cTable = require('console.table');
const Table = require('cli-table3');
const dotenv = require('dotenv');
dotenv.config();


// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to start the command-line application
function startApp() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Update employee managers',
          'View employees by manager',
          'View employees by department',
          'Delete departments',
          'Delete roles',
          'Delete employees',
          'View the total utilized budget of a department',
          'Exit',
        ],
      },
    ])
    .then((answers) => {
      switch (answers.action) {
        case 'View all departments':
          viewAllDepartments();
          break;
        case 'View all roles':
          viewAllRoles();
          break;
        case 'View all employees':
          viewAllEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
        case 'Update employee managers':
          updateEmployeeManager();
          break;
        case 'View employees by manager':
          viewEmployeesByManager();
          break;
        case 'View employees by department':
          viewEmployeesByDepartment();
          break;
        case 'Delete departments':
          deleteDepartment();
          break;
        case 'Delete roles':
          deleteRole();
          break;
        case 'Delete employees':
          deleteEmployee();
          break;
        case 'View the total utilized budget of a department':
          viewDepartmentBudget();
          break;
        case 'Exit':
          console.log('Goodbye!');
          pool.end();
          process.exit();
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      pool.end();
    });
}


// Function to display a success message in green text
function successMessage(message) {
  const boldGreen = '\x1b[1m\x1b[32m'; // Bold and green text
  const resetStyle = '\x1b[0m'; // Reset text style to default

  console.log(`${boldGreen}${message}${resetStyle}`);
}


// Implement the database queries and actions

// Function to view all departments
async function viewAllDepartments() {
  try {
    const [rows] = await pool.query('SELECT id, name FROM department');

    // Define the custom style for the table
    const table = new Table({
      head: ['ID', 'Name'],
      colWidths: [5, 20],
      style: { 'padding-left': 1, 'padding-right': 1, head: ['cyan', 'bold'], border: ['yellow'] },
    });

    rows.forEach((row) => table.push([row.id, row.name]));

    console.log(table.toString());
    startApp();
  } catch (error) {
    console.error('\x1b[31mError retrieving departments:', error, '\x1b[0m');
    startApp();
  }
}

// Function to view all roles
async function viewAllRoles() {
  try {
    const [rows] = await pool.query('SELECT r.id, r.title, r.salary, d.name AS department FROM role r JOIN department d ON r.department_id = d.id');

    const table = new Table({
      head: ['ID', 'Title', 'Salary', 'Department'],
      colWidths: [5, 30, 15, 30],
      style: { 'padding-left': 1, 'padding-right': 1, head: ['cyan', 'bold'], border: ['yellow'] },
    });

    rows.forEach((row) => table.push([row.id, row.title, row.salary, row.department]));

    console.log(table.toString());
    startApp();
  } catch (error) {
    console.error('\x1b[31mError retrieving roles:', error, '\x1b[0m');
    startApp();
  }
}


// Function to view all employees
async function viewAllEmployees() {
  try {
    const [rows] = await pool.query('SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, " ", m.last_name) AS manager FROM employee e LEFT JOIN role r ON e.role_id = r.id LEFT JOIN department d ON r.department_id = d.id LEFT JOIN employee m ON e.manager_id = m.id');

    const table = new Table({
      head: ['ID', 'First Name', 'Last Name', 'Job Title', 'Department', 'Salary', 'Manager'],
      colWidths: [5, 15, 15, 30, 30, 15, 30],
      style: { 'padding-left': 1, 'padding-right': 1, head: ['cyan', 'bold'], border: ['yellow'] },
    });

    rows.forEach((row) => table.push([row.id, row.first_name, row.last_name, row.title, row.department, row.salary, row.manager]));

    console.log(table.toString());
    startApp();
  } catch (error) {
    console.error('\x1b[31mError retrieving employees:', error, '\x1b[0m');
    startApp();
  }
}


// Function to add a department
async function addDepartment() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the name of the department:',
        validate: (input) => (input ? true : 'Department name cannot be empty'),
      },
    ]);

    await pool.query('INSERT INTO department (name) VALUES (?)', [answers.name]);
    successMessage('Department added successfully.');
  } catch (error) {
    console.error('\x1b[31mError adding department:', error, '\x1b[0m');
  }

  startApp();
}

// Function to add a role
async function addRole() {
  try {
    // Check if the id column has AUTO_INCREMENT attribute
    const [columns] = await pool.query('SHOW COLUMNS FROM role LIKE "id"');
    const idColumn = columns[0];
    const isAutoIncrement = idColumn.Extra.toLowerCase() === 'auto_increment';

    if (!isAutoIncrement) {
      // If the id column doesn't have AUTO_INCREMENT attribute, modify the table
      await pool.query('ALTER TABLE role MODIFY COLUMN id INT AUTO_INCREMENT');
    }

    const [departments] = await pool.query('SELECT id, name FROM department');

    const departmentChoices = departments.map((department) => ({
      name: department.name,
      value: department.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Enter the title of the role:',
        validate: (input) => (input ? true : 'Role title cannot be empty'),
      },
      {
        type: 'input',
        name: 'salary',
        message: 'Enter the salary for the role:',
        validate: (input) => (input && !isNaN(input) ? true : 'Invalid salary. Please enter a number.'),
      },
      {
        type: 'list',
        name: 'department_id',
        message: 'Select the department for the role:',
        choices: departmentChoices,
      },
    ]);

    await pool.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [
      answers.title,
      answers.salary,
      answers.department_id,
    ]);
    successMessage('Role added successfully.');
  } catch (error) {
    console.error('\x1b[31mError adding role:', error, '\x1b[0m');
  }

  startApp();
}


// Function to add an employee
async function addEmployee() {
  try {
    const [roles] = await pool.query('SELECT id, title FROM role');
    const [managers] = await pool.query('SELECT id, first_name, last_name FROM employee WHERE manager_id IS NULL');

    const roleChoices = roles.map((role) => ({
      name: role.title,
      value: role.id,
    }));

    const managerChoices = managers.map((manager) => ({
      name: `${manager.first_name} ${manager.last_name}`,
      value: manager.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'first_name',
        message: 'Enter the first name of the employee:',
        validate: (input) => (input ? true : 'First name cannot be empty'),
      },
      {
        type: 'input',
        name: 'last_name',
        message: 'Enter the last name of the employee:',
        validate: (input) => (input ? true : 'Last name cannot be empty'),
      },
      {
        type: 'list',
        name: 'role_id',
        message: 'Select the role for the employee:',
        choices: roleChoices,
      },
      {
        type: 'list',
        name: 'manager_id',
        message: 'Select the manager for the employee:',
        choices: managerChoices,
      },
    ]);

    await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [
      answers.first_name,
      answers.last_name,
      answers.role_id,
      answers.manager_id,
    ]);
    successMessage('Employee added successfully.');
  } catch (error) {
    console.error('\x1b[31mError adding employee:', error, '\x1b[0m');
  }

  startApp();
}

// Function to update an employee role
async function updateEmployeeRole() {
  try {
    const [employees] = await pool.query('SELECT id, first_name, last_name FROM employee');
    const [roles] = await pool.query('SELECT id, title FROM role');

    const employeeChoices = employees.map((employee) => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id,
    }));

    const roleChoices = roles.map((role) => ({
      name: role.title,
      value: role.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select the employee to update their role:',
        choices: employeeChoices,
      },
      {
        type: 'list',
        name: 'roleId',
        message: 'Select the new role for the employee:',
        choices: roleChoices,
      },
    ]);

    await pool.query('UPDATE employee SET role_id = ? WHERE id = ?', [answers.roleId, answers.employeeId]);
    successMessage('Employee role updated successfully.');
  } catch (error) {
    console.error('\x1b[31mError updating employee role:', error, '\x1b[0m');
  }

  startApp();
}

// Function to update employee managers
async function updateEmployeeManager() {
  try {
    const [employees] = await pool.query('SELECT id, first_name, last_name FROM employee');
    const [managers] = await pool.query('SELECT id, first_name, last_name FROM employee WHERE manager_id IS NULL');

    const employeeChoices = employees.map((employee) => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id,
    }));

    const managerChoices = managers.map((manager) => ({
      name: `${manager.first_name} ${manager.last_name}`,
      value: manager.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select the employee to update their manager:',
        choices: employeeChoices,
      },
      {
        type: 'list',
        name: 'managerId',
        message: 'Select the new manager for the employee:',
        choices: managerChoices,
      },
    ]);

    await pool.query('UPDATE employee SET manager_id = ? WHERE id = ?', [answers.managerId, answers.employeeId]);
    successMessage('Employee manager updated successfully.');
  } catch (error) {
    console.error('\x1b[31mError updating employee manager:', error, '\x1b[0m');
  }

  startApp();
}

// Function to view employees by manager
async function viewEmployeesByManager() {
  try {
    const [managers] = await pool.query('SELECT id, first_name, last_name FROM employee WHERE manager_id IS NULL');

    const managerChoices = managers.map((manager) => ({
      name: `${manager.first_name} ${manager.last_name}`,
      value: manager.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'managerId',
        message: 'Select the manager to view their employees:',
        choices: managerChoices,
      },
    ]);

    const [rows] = await pool.query('SELECT id, first_name, last_name FROM employee WHERE manager_id = ?', [
      answers.managerId,
    ]);

    const table = new Table({
      head: ['ID', 'First Name', 'Last Name'],
      colWidths: [5, 15, 15],
      style: { 'padding-left': 1, 'padding-right': 1, head: ['cyan', 'bold'], border: ['yellow'] },
    });

    rows.forEach((row) => table.push([row.id, row.first_name, row.last_name]));

    console.log(table.toString());
  } catch (error) {
    console.error('\x1b[31mError retrieving employees by manager:', error, '\x1b[0m');
  }

  startApp();
}


// Function to view employees by department
async function viewEmployeesByDepartment() {
  try {
    const [departments] = await pool.query('SELECT id, name FROM department');

    const departmentChoices = departments.map((department) => ({
      name: department.name,
      value: department.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select the department to view its employees:',
        choices: departmentChoices,
      },
    ]);

    const [rows] = await pool.query('SELECT id, first_name, last_name FROM employee WHERE role_id IN (SELECT id FROM role WHERE department_id = ?)', [
      answers.departmentId,
    ]);

    const table = new Table({
      head: ['ID', 'First Name', 'Last Name'],
      colWidths: [5, 15, 15],
      style: { 'padding-left': 1, 'padding-right': 1, head: ['cyan', 'bold'], border: ['yellow'] },
    });

    rows.forEach((row) => table.push([row.id, row.first_name, row.last_name]));

    console.log(table.toString());
  } catch (error) {
    console.error('\x1b[31mError retrieving employees by department:', error, '\x1b[0m');
  }

  startApp();
}


// Function to delete a department
async function deleteDepartment() {
  try {
    const [departments] = await pool.query('SELECT id, name FROM department');

    const departmentChoices = departments.map((department) => ({
      name: department.name,
      value: department.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select the department to delete:',
        choices: departmentChoices,
      },
    ]);

    await pool.query('DELETE FROM department WHERE id = ?', [answers.departmentId]);
    successMessage('Department deleted successfully.');
  } catch (error) {
    console.error('\x1b[31mError deleting department:', error, '\x1b[0m');
  }

  startApp();
}

// Function to delete a role
async function deleteRole() {
  try {
    const [roles] = await pool.query('SELECT id, title FROM role');

    const roleChoices = roles.map((role) => ({
      name: role.title,
      value: role.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'roleId',
        message: 'Select the role to delete:',
        choices: roleChoices,
      },
    ]);

    await pool.query('DELETE FROM role WHERE id = ?', [answers.roleId]);
    successMessage('Role deleted successfully.');
  } catch (error) {
    console.error('\x1b[31mError deleting role:', error, '\x1b[0m');
  }

  startApp();
}

// Function to delete an employee
async function deleteEmployee() {
    try {
      const [employees] = await pool.query('SELECT id, first_name, last_name FROM employee');
  
      const employeeChoices = employees.map((employee) => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id,
      }));
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'employeeId',
          message: 'Select the employee to delete:',
          choices: employeeChoices,
        },
      ]);
  
      // Get the manager_id of the employee to be deleted
      const [employee] = await pool.query('SELECT manager_id FROM employee WHERE id = ?', [
        answers.employeeId,
      ]);
      const { manager_id } = employee[0];
  
      // Update the manager_id of all employees referencing the employee to be deleted to NULL
      if (manager_id !== null) {
        await pool.query('UPDATE employee SET manager_id = NULL WHERE manager_id = ?', [
          answers.employeeId,
        ]);
      }
  
      // Now, you can safely delete the employee
      await pool.query('DELETE FROM employee WHERE id = ?', [answers.employeeId]);
  
      successMessage('Employee deleted successfully.');
    } catch (error) {
      console.error('\x1b[31mError deleting employee:', error, '\x1b[0m');
    }
  
    startApp();
  }
  

// Function to view the total utilized budget of a department
async function viewDepartmentBudget() {
  try {
    const [departments] = await pool.query('SELECT id, name FROM department');

    const departmentChoices = departments.map((department) => ({
      name: department.name,
      value: department.id,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select the department to view its budget:',
        choices: departmentChoices,
      },
    ]);

    const [rows] = await pool.query('SELECT SUM(salary) AS total_budget FROM role WHERE department_id = ?', [
      answers.departmentId,
    ]);

    const table = new Table({
      head: ['Total Budget'],
      colWidths: [15],
      style: { 'padding-left': 1, 'padding-right': 1, head: ['cyan', 'bold'], border: ['yellow'] },
    });

    rows.forEach((row) => table.push([row.total_budget]));

    console.log(table.toString());
  } catch (error) {
    console.error('\x1b[31mError retrieving department budget:', error, '\x1b[0m');
  }

  startApp();
}



// Welcome message Design

// Text colors escape codes
const textColorYellow = '\x1b[33m';
const textColorCyan = '\x1b[36m';

// Bold formatting escape code
const textBold = '\x1b[1m';

// Reset escape code
const resetColorAndBold = '\x1b[0m';

console.log('_______________________________________________');
console.log(textBold+textColorYellow+'    Hello! Welcome to'+resetColorAndBold);
console.log(textBold+textColorCyan+' ______      ____    ____    _________'+resetColorAndBold);
console.log(textBold+textColorCyan+'|______|     ||\\    //||    ||_______|'+resetColorAndBold);
console.log(textBold+textColorCyan+'||           || \\  // ||    ||        '+resetColorAndBold);
console.log(textBold+textColorCyan+'||           ||  \\//  ||    ||_______  '+resetColorAndBold);
console.log(textBold+textColorCyan+'||           ||       ||    ||______ | '+resetColorAndBold);
console.log(textBold+textColorCyan+'||_____      ||       ||     ______| | '+resetColorAndBold);
console.log(textBold+textColorCyan+'|______|     ||       ||    |______|_| '+resetColorAndBold);
console.log('_______________________________________________');
console.log('                                                          ');
console.log('                                                          ');

// Start the application
startApp();
