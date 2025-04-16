const inquirer = require('inquirer');
const cTable = require('console.table');
const db = require('./src/db');

// Main menu options
const menuChoices = [
  { name: 'View All Departments', value: 'VIEW_DEPARTMENTS' },
  { name: 'View All Roles', value: 'VIEW_ROLES' },
  { name: 'View All Employees', value: 'VIEW_EMPLOYEES' },
  { name: 'Add a Department', value: 'ADD_DEPARTMENT' },
  { name: 'Add a Role', value: 'ADD_ROLE' },
  { name: 'Add an Employee', value: 'ADD_EMPLOYEE' },
  { name: 'Update an Employee Role', value: 'UPDATE_EMPLOYEE_ROLE' },
  new inquirer.Separator(),
  { name: 'Update Employee Manager', value: 'UPDATE_EMPLOYEE_MANAGER' },
  { name: 'View Employees by Manager', value: 'VIEW_EMPLOYEES_BY_MANAGER' },
  { name: 'View Employees by Department', value: 'VIEW_EMPLOYEES_BY_DEPARTMENT' },
  { name: 'Delete Department', value: 'DELETE_DEPARTMENT' },
  { name: 'Delete Role', value: 'DELETE_ROLE' },
  { name: 'Delete Employee', value: 'DELETE_EMPLOYEE' },
  { name: 'View Department Budget', value: 'VIEW_DEPARTMENT_BUDGET' },
  new inquirer.Separator(),
  { name: 'Exit', value: 'EXIT' }
];

// Format data for display
const formatEmployeeData = (data) => {
  return data.map(employee => {
    return {
      ID: employee.id,
      'First Name': employee.first_name,
      'Last Name': employee.last_name,
      Title: employee.title,
      Department: employee.department,
      Salary: employee.salary,
      Manager: employee.manager || 'None'
    };
  });
};

// Main menu function
async function mainMenu() {
  try {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: menuChoices,
        pageSize: 15
      }
    ]);

    switch (choice) {
      case 'VIEW_DEPARTMENTS':
        await viewAllDepartments();
        break;
      case 'VIEW_ROLES':
        await viewAllRoles();
        break;
      case 'VIEW_EMPLOYEES':
        await viewAllEmployees();
        break;
      case 'ADD_DEPARTMENT':
        await addDepartment();
        break;
      case 'ADD_ROLE':
        await addRole();
        break;
      case 'ADD_EMPLOYEE':
        await addEmployee();
        break;
      case 'UPDATE_EMPLOYEE_ROLE':
        await updateEmployeeRole();
        break;
      case 'UPDATE_EMPLOYEE_MANAGER':
        await updateEmployeeManager();
        break;
      case 'VIEW_EMPLOYEES_BY_MANAGER':
        await viewEmployeesByManager();
        break;
      case 'VIEW_EMPLOYEES_BY_DEPARTMENT':
        await viewEmployeesByDepartment();
        break;
      case 'DELETE_DEPARTMENT':
        await deleteDepartment();
        break;
      case 'DELETE_ROLE':
        await deleteRole();
        break;
      case 'DELETE_EMPLOYEE':
        await deleteEmployee();
        break;
      case 'VIEW_DEPARTMENT_BUDGET':
        await viewDepartmentBudget();
        break;
      case 'EXIT':
        console.log('Goodbye!');
        process.exit(0);
    }

    // Return to main menu after action completes
    await mainMenu();
  } catch (err) {
    console.error('An error occurred:', err);
    process.exit(1);
  }
}

// View all departments
async function viewAllDepartments() {
  try {
    const departments = await db.viewAllDepartments();
    console.log('\n');
    console.table(departments.map(dept => ({
      ID: dept.id,
      Name: dept.name
    })));
  } catch (err) {
    console.error('Error viewing departments:', err);
  }
}

// View all roles
async function viewAllRoles() {
  try {
    const roles = await db.viewAllRoles();
    console.log('\n');
    console.table(roles.map(role => ({
      ID: role.id,
      Title: role.title,
      Department: role.department,
      Salary: role.salary
    })));
  } catch (err) {
    console.error('Error viewing roles:', err);
  }
}

// View all employees
async function viewAllEmployees() {
  try {
    const employees = await db.viewAllEmployees();
    console.log('\n');
    console.table(formatEmployeeData(employees));
  } catch (err) {
    console.error('Error viewing employees:', err);
  }
}

// Add a department
async function addDepartment() {
  try {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the department?',
        validate: input => input ? true : 'Department name cannot be empty'
      }
    ]);

    const result = await db.addDepartment(name);
    console.log(`\nAdded ${result.name} department to the database\n`);
  } catch (err) {
    console.error('Error adding department:', err);
  }
}

// Add a role
async function addRole() {
  try {
    const departments = await db.getDepartments();
    
    if (departments.length === 0) {
      console.log('\nYou need to add a department first.\n');
      return;
    }

    const departmentChoices = departments.map(dept => ({
      name: dept.name,
      value: dept.id
    }));

    const roleAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'What is the name of the role?',
        validate: input => input ? true : 'Role name cannot be empty'
      },
      {
        type: 'input',
        name: 'salary',
        message: 'What is the salary for this role?',
        validate: input => {
          const salary = parseFloat(input);
          return !isNaN(salary) && salary > 0 ? true : 'Please enter a valid salary';
        }
      },
      {
        type: 'list',
        name: 'department_id',
        message: 'Which department does this role belong to?',
        choices: departmentChoices
      }
    ]);

    const result = await db.addRole(
      roleAnswers.title,
      parseFloat(roleAnswers.salary),
      roleAnswers.department_id
    );

    console.log(`\nAdded ${result.title} role to the database\n`);
  } catch (err) {
    console.error('Error adding role:', err);
  }
}

// Add an employee
async function addEmployee() {
  try {
    const roles = await db.getRoles();
    
    if (roles.length === 0) {
      console.log('\nYou need to add a role first.\n');
      return;
    }

    const roleChoices = roles.map(role => ({
      name: role.title,
      value: role.id
    }));

    const employees = await db.getEmployees();
    const managerChoices = [
      { name: 'None', value: null },
      ...employees.map(emp => ({
        name: emp.name,
        value: emp.id
      }))
    ];

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'first_name',
        message: "What is the employee's first name?",
        validate: input => input ? true : "First name cannot be empty"
      },
      {
        type: 'input',
        name: 'last_name',
        message: "What is the employee's last name?",
        validate: input => input ? true : "Last name cannot be empty"
      },
      {
        type: 'list',
        name: 'role_id',
        message: "What is the employee's role?",
        choices: roleChoices
      },
      {
        type: 'list',
        name: 'manager_id',
        message: "Who is the employee's manager?",
        choices: managerChoices
      }
    ]);

    const result = await db.addEmployee(
      answers.first_name,
      answers.last_name,
      answers.role_id,
      answers.manager_id
    );

    console.log(`\nAdded ${result.first_name} ${result.last_name} to the database\n`);
  } catch (err) {
    console.error('Error adding employee:', err);
  }
}

// Update an employee's role
async function updateEmployeeRole() {
  try {
    const employees = await db.getEmployees();
    
    if (employees.length === 0) {
      console.log('\nNo employees found to update.\n');
      return;
    }

    const employeeChoices = employees.map(emp => ({
      name: emp.name,
      value: emp.id
    }));

    const roles = await db.getRoles();
    const roleChoices = roles.map(role => ({
      name: role.title,
      value: role.id
    }));

    const { employee_id, role_id } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employee_id',
        message: 'Which employee would you like to update?',
        choices: employeeChoices
      },
      {
        type: 'list',
        name: 'role_id',
        message: 'What is their new role?',
        choices: roleChoices
      }
    ]);

    const result = await db.updateEmployeeRole(employee_id, role_id);
    console.log(`\nUpdated ${result.first_name} ${result.last_name}'s role in the database\n`);
  } catch (err) {
    console.error('Error updating employee role:', err);
  }
}

// BONUS: Update an employee's manager
async function updateEmployeeManager() {
  try {
    const employees = await db.getEmployees();
    
    if (employees.length === 0) {
      console.log('\nNo employees found to update.\n');
      return;
    }

    const employeeChoices = employees.map(emp => ({
      name: emp.name,
      value: emp.id
    }));

    const { employee_id } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employee_id',
        message: 'Which employee would you like to update?',
        choices: employeeChoices
      }
    ]);

    // Filter out the selected employee from potential managers
    const managerChoices = [
      { name: 'None', value: null },
      ...employees
        .filter(emp => emp.id !== employee_id)
        .map(emp => ({
          name: emp.name,
          value: emp.id
        }))
    ];

    const { manager_id } = await inquirer.prompt([
      {
        type: 'list',
        name: 'manager_id',
        message: 'Who is their new manager?',
        choices: managerChoices
      }
    ]);

    const result = await db.updateEmployeeManager(employee_id, manager_id);
    console.log(`\nUpdated ${result.first_name} ${result.last_name}'s manager in the database\n`);
  } catch (err) {
    console.error('Error updating employee manager:', err);
  }
}

// BONUS: View employees by manager
async function viewEmployeesByManager() {
  try {
    const employees = await db.getEmployees();
    
    if (employees.length === 0) {
      console.log('\nNo employees found.\n');
      return;
    }

    // Only include employees who are managers (have employees reporting to them)
    const managers = await db.getEmployees();
    
    if (managers.length === 0) {
      console.log('\nNo managers found.\n');
      return;
    }

    const managerChoices = managers.map(manager => ({
      name: manager.name,
      value: manager.id
    }));

    const { manager_id } = await inquirer.prompt([
      {
        type: 'list',
        name: 'manager_id',
        message: 'Which manager would you like to see employees for?',
        choices: managerChoices
      }
    ]);

    const employees_by_manager = await db.viewEmployeesByManager(manager_id);
    
    if (employees_by_manager.length === 0) {
      console.log('\nThis manager has no direct reports.\n');
      return;
    }

    console.log('\n');
    console.table(employees_by_manager.map(emp => ({
      ID: emp.id,
      'First Name': emp.first_name,
      'Last Name': emp.last_name,
      Title: emp.title,
      Department: emp.department
    })));
  } catch (err) {
    console.error('Error viewing employees by manager:', err);
  }
}

// BONUS: View employees by department
async function viewEmployeesByDepartment() {
  try {
    const departments = await db.getDepartments();
    
    if (departments.length === 0) {
      console.log('\nNo departments found.\n');
      return;
    }

    const departmentChoices = departments.map(dept => ({
      name: dept.name,
      value: dept.id
    }));

    const { department_id } = await inquirer.prompt([
      {
        type: 'list',
        name: 'department_id',
        message: 'Which department would you like to see employees for?',
        choices: departmentChoices
      }
    ]);

    const employees_by_dept = await db.viewEmployeesByDepartment(department_id);
    
    if (employees_by_dept.length === 0) {
      console.log('\nNo employees found in this department.\n');
      return;
    }

    console.log('\n');
    console.table(employees_by_dept.map(emp => ({
      ID: emp.id,
      'First Name': emp.first_name,
      'Last Name': emp.last_name,
      Title: emp.title,
      Manager: emp.manager || 'None'
    })));
  } catch (err) {
    console.error('Error viewing employees by department:', err);
  }
}

// BONUS: Delete a department
async function deleteDepartment() {
  try {
    const departments = await db.getDepartments();
    
    if (departments.length === 0) {
      console.log('\nNo departments found to delete.\n');
      return;
    }

    const departmentChoices = departments.map(dept => ({
      name: dept.name,
      value: dept.id
    }));

    const { department_id, confirm } = await inquirer.prompt([
      {
        type: 'list',
        name: 'department_id',
        message: 'Which department would you like to delete?',
        choices: departmentChoices
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure? This will also delete all associated roles and employees!',
        default: false
      }
    ]);

    if (!confirm) {
      console.log('\nDeletion cancelled.\n');
      return;
    }

    const result = await db.deleteDepartment(department_id);
    console.log(`\nDeleted ${result.name} department from the database\n`);
  } catch (err) {
    console.error('Error deleting department:', err);
  }
}

// BONUS: Delete a role
async function deleteRole() {
  try {
    const roles = await db.getRoles();
    
    if (roles.length === 0) {
      console.log('\nNo roles found to delete.\n');
      return;
    }

    const roleChoices = roles.map(role => ({
      name: role.title,
      value: role.id
    }));

    const { role_id, confirm } = await inquirer.prompt([
      {
        type: 'list',
        name: 'role_id',
        message: 'Which role would you like to delete?',
        choices: roleChoices
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure? This will also delete all employees with this role!',
        default: false
      }
    ]);

    if (!confirm) {
      console.log('\nDeletion cancelled.\n');
      return;
    }

    const result = await db.deleteRole(role_id);
    console.log(`\nDeleted ${result.title} role from the database\n`);
  } catch (err) {
    console.error('Error deleting role:', err);
  }
}

// BONUS: Delete an employee
async function deleteEmployee() {
  try {
    const employees = await db.getEmployees();
    
    if (employees.length === 0) {
      console.log('\nNo employees found to delete.\n');
      return;
    }

    const employeeChoices = employees.map(emp => ({
      name: emp.name,
      value: emp.id
    }));

    const { employee_id, confirm } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employee_id',
        message: 'Which employee would you like to delete?',
        choices: employeeChoices
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete this employee?',
        default: false
      }
    ]);

    if (!confirm) {
      console.log('\nDeletion cancelled.\n');
      return;
    }

    const result = await db.deleteEmployee(employee_id);
    console.log(`\nDeleted ${result.first_name} ${result.last_name} from the database\n`);
  } catch (err) {
    console.error('Error deleting employee:', err);
  }
}

// BONUS: View the total utilized budget of a department
async function viewDepartmentBudget() {
  try {
    const departments = await db.getDepartments();
    
    if (departments.length === 0) {
      console.log('\nNo departments found.\n');
      return;
    }

    const departmentChoices = departments.map(dept => ({
      name: dept.name,
      value: dept.id
    }));

    const { department_id } = await inquirer.prompt([
      {
        type: 'list',
        name: 'department_id',
        message: 'Which department budget would you like to view?',
        choices: departmentChoices
      }
    ]);

    const budget = await db.viewDepartmentBudget(department_id);
    
    console.log('\n');
    console.table([{
      Department: budget.name,
      'Employee Count': budget.employee_count,
      'Total Budget': `$${parseFloat(budget.utilized_budget).toLocaleString()}`
    }]);
  } catch (err) {
    console.error('Error viewing department budget:', err);
  }
}

// Display welcome message and start application
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                EMPLOYEE MANAGEMENT SYSTEM                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Initialize database and start the application
async function init() {
  try {
    // Check connection to the database
    const connected = await db.checkConnection();
    if (!connected) {
      console.error('\nCould not connect to the database. Please check your PostgreSQL configuration and try again.\n');
      process.exit(1);
    }
    
    // Initialize the database
    const initialized = await db.initializeDatabase();
    if (!initialized) {
      console.error('\nCould not initialize the database. Please check your PostgreSQL configuration and try again.\n');
      process.exit(1);
    }
    
    console.log('Database connection successful!');
    
    // Start the main menu
    await mainMenu();
  } catch (err) {
    console.error('Fatal error initializing application:', err);
    process.exit(1);
  }
}

// Start the application
init();