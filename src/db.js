const { Pool } = require('pg');
require('dotenv').config();

// Create a pool with default values if env variables aren't set
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'employee_db',
  port: process.env.DB_PORT || 5432,
});

// Handle connection errors without crashing
pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// In-memory storage as fallback if database is unavailable
const inMemoryDB = {
  departments: [
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'Finance' },
    { id: 3, name: 'Legal' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'Human Resources' }
  ],
  roles: [
    { id: 1, title: 'Lead Engineer', salary: 150000, department_id: 1 },
    { id: 2, title: 'Software Engineer', salary: 120000, department_id: 1 },
    { id: 3, title: 'Finance Lead', salary: 160000, department_id: 2 },
    { id: 4, title: 'Accountant', salary: 125000, department_id: 2 },
    { id: 5, title: 'Legal Team Lead', salary: 250000, department_id: 3 },
    { id: 6, title: 'Lawyer', salary: 190000, department_id: 3 },
    { id: 7, title: 'Sales Lead', salary: 100000, department_id: 4 },
    { id: 8, title: 'Salesperson', salary: 80000, department_id: 4 },
    { id: 9, title: 'HR Director', salary: 190000, department_id: 5 },
    { id: 10, title: 'HR Specialist', salary: 115000, department_id: 5 }
  ],
  employees: [
    { id: 1, first_name: 'John', last_name: 'Doe', role_id: 1, manager_id: null },
    { id: 2, first_name: 'Mike', last_name: 'Chan', role_id: 2, manager_id: 1 },
    { id: 3, first_name: 'Ashley', last_name: 'Rodriguez', role_id: 3, manager_id: null },
    { id: 4, first_name: 'Kevin', last_name: 'Tupik', role_id: 4, manager_id: 3 },
    { id: 5, first_name: 'Kunal', last_name: 'Singh', role_id: 5, manager_id: null },
    { id: 6, first_name: 'Malia', last_name: 'Brown', role_id: 6, manager_id: 5 },
    { id: 7, first_name: 'Sarah', last_name: 'Lourd', role_id: 7, manager_id: null },
    { id: 8, first_name: 'Tom', last_name: 'Allen', role_id: 8, manager_id: 7 },
    { id: 9, first_name: 'Sam', last_name: 'Kash', role_id: 9, manager_id: null },
    { id: 10, first_name: 'Ana', last_name: 'Bell', role_id: 10, manager_id: 9 }
  ],
  nextIds: {
    department: 6,
    role: 11,
    employee: 11
  }
};

// Track if we're using in-memory storage
let useInMemory = false;

module.exports = {
  // Check database connection
  checkConnection: async () => {
    try {
      await pool.query('SELECT NOW()');
      useInMemory = false;
      return true;
    } catch (err) {
      console.error('Database connection failed:', err.message);
      console.log('Falling back to in-memory storage...');
      useInMemory = true;
      return false;
    }
  },

  // Initialize database
  initializeDatabase: async () => {
    if (useInMemory) {
      return true; // In-memory data already initialized
    }
    
    try {
      // Create tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS department (
          id SERIAL PRIMARY KEY,
          name VARCHAR(30) UNIQUE NOT NULL
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS role (
          id SERIAL PRIMARY KEY,
          title VARCHAR(30) UNIQUE NOT NULL,
          salary DECIMAL NOT NULL,
          department_id INTEGER NOT NULL,
          FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE CASCADE
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS employee (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(30) NOT NULL,
          last_name VARCHAR(30) NOT NULL,
          role_id INTEGER NOT NULL,
          manager_id INTEGER,
          FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
          FOREIGN KEY (manager_id) REFERENCES employee(id) ON DELETE SET NULL
        )
      `);
      
      // Check if we already have data
      const { rows } = await pool.query('SELECT COUNT(*) FROM department');
      if (parseInt(rows[0].count) === 0) {
        // Seed data
        await pool.query(`
          INSERT INTO department (name) VALUES
          ('Engineering'),
          ('Finance'),
          ('Legal'),
          ('Sales'),
          ('Human Resources')
        `);
        
        await pool.query(`
          INSERT INTO role (title, salary, department_id) VALUES
          ('Lead Engineer', 150000, 1),
          ('Software Engineer', 120000, 1),
          ('Finance Lead', 160000, 2),
          ('Accountant', 125000, 2),
          ('Legal Team Lead', 250000, 3),
          ('Lawyer', 190000, 3),
          ('Sales Lead', 100000, 4),
          ('Salesperson', 80000, 4),
          ('HR Director', 190000, 5),
          ('HR Specialist', 115000, 5)
        `);
        
        await pool.query(`
          INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
          ('John', 'Doe', 1, NULL),
          ('Mike', 'Chan', 2, 1),
          ('Ashley', 'Rodriguez', 3, NULL),
          ('Kevin', 'Tupik', 4, 3),
          ('Kunal', 'Singh', 5, NULL),
          ('Malia', 'Brown', 6, 5),
          ('Sarah', 'Lourd', 7, NULL),
          ('Tom', 'Allen', 8, 7),
          ('Sam', 'Kash', 9, NULL),
          ('Ana', 'Bell', 10, 9)
        `);
      }
      
      return true;
    } catch (err) {
      console.error('Error initializing database:', err.message);
      console.log('Falling back to in-memory storage...');
      useInMemory = true;
      return true; // Return true so app can continue with in-memory
    }
  },

  // View all departments
  viewAllDepartments: async () => {
    if (useInMemory) {
      return inMemoryDB.departments;
    }
    
    try {
      const result = await pool.query('SELECT id, name FROM department ORDER BY id');
      return result.rows;
    } catch (err) {
      console.error('Error viewing departments:', err.message);
      return inMemoryDB.departments; // Fallback to in-memory
    }
  },

  // View all roles with department names
  viewAllRoles: async () => {
    if (useInMemory) {
      return inMemoryDB.roles.map(role => {
        const dept = inMemoryDB.departments.find(d => d.id === role.department_id);
        return {
          ...role,
          department: dept ? dept.name : 'Unknown'
        };
      });
    }
    
    try {
      const query = `
        SELECT r.id, r.title, r.salary, d.name AS department
        FROM role r
        JOIN department d ON r.department_id = d.id
        ORDER BY r.id
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      console.error('Error viewing roles:', err.message);
      
      // Fallback to in-memory
      return inMemoryDB.roles.map(role => {
        const dept = inMemoryDB.departments.find(d => d.id === role.department_id);
        return {
          ...role,
          department: dept ? dept.name : 'Unknown'
        };
      });
    }
  },

  // View all employees with role, department, and manager info
  viewAllEmployees: async () => {
    if (useInMemory) {
      return inMemoryDB.employees.map(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        const dept = role ? inMemoryDB.departments.find(d => d.id === role.department_id) : null;
        const manager = emp.manager_id ? inMemoryDB.employees.find(m => m.id === emp.manager_id) : null;
        
        return {
          ...emp,
          title: role ? role.title : 'Unknown',
          salary: role ? role.salary : 0,
          department: dept ? dept.name : 'Unknown',
          manager: manager ? `${manager.first_name} ${manager.last_name}` : null
        };
      });
    }
    
    try {
      const query = `
        SELECT 
          e.id, 
          e.first_name, 
          e.last_name, 
          r.title, 
          d.name AS department, 
          r.salary,
          CONCAT(m.first_name, ' ', m.last_name) AS manager
        FROM employee e
        JOIN role r ON e.role_id = r.id
        JOIN department d ON r.department_id = d.id
        LEFT JOIN employee m ON e.manager_id = m.id
        ORDER BY e.id
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      console.error('Error viewing employees:', err.message);
      
      // Fallback to in-memory
      return inMemoryDB.employees.map(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        const dept = role ? inMemoryDB.departments.find(d => d.id === role.department_id) : null;
        const manager = emp.manager_id ? inMemoryDB.employees.find(m => m.id === emp.manager_id) : null;
        
        return {
          ...emp,
          title: role ? role.title : 'Unknown',
          salary: role ? role.salary : 0,
          department: dept ? dept.name : 'Unknown',
          manager: manager ? `${manager.first_name} ${manager.last_name}` : null
        };
      });
    }
  },

  // Add a department
  addDepartment: async (name) => {
    if (useInMemory) {
      const newDept = {
        id: inMemoryDB.nextIds.department++,
        name
      };
      inMemoryDB.departments.push(newDept);
      return newDept;
    }
    
    try {
      const result = await pool.query(
        'INSERT INTO department (name) VALUES ($1) RETURNING id, name',
        [name]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error adding department:', err.message);
      
      // Fallback to in-memory
      const newDept = {
        id: inMemoryDB.nextIds.department++,
        name
      };
      inMemoryDB.departments.push(newDept);
      return newDept;
    }
  },

  // Add a role
  addRole: async (title, salary, departmentId) => {
    if (useInMemory) {
      const newRole = {
        id: inMemoryDB.nextIds.role++,
        title,
        salary,
        department_id: departmentId
      };
      inMemoryDB.roles.push(newRole);
      return newRole;
    }
    
    try {
      const result = await pool.query(
        'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3) RETURNING id, title, salary, department_id',
        [title, salary, departmentId]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error adding role:', err.message);
      
      // Fallback to in-memory
      const newRole = {
        id: inMemoryDB.nextIds.role++,
        title,
        salary,
        department_id: departmentId
      };
      inMemoryDB.roles.push(newRole);
      return newRole;
    }
  },

  // Add an employee
  addEmployee: async (firstName, lastName, roleId, managerId) => {
    if (useInMemory) {
      const newEmployee = {
        id: inMemoryDB.nextIds.employee++,
        first_name: firstName,
        last_name: lastName,
        role_id: roleId,
        manager_id: managerId
      };
      inMemoryDB.employees.push(newEmployee);
      return newEmployee;
    }
    
    try {
      const result = await pool.query(
        'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, role_id, manager_id',
        [firstName, lastName, roleId, managerId || null]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error adding employee:', err.message);
      
      // Fallback to in-memory
      const newEmployee = {
        id: inMemoryDB.nextIds.employee++,
        first_name: firstName,
        last_name: lastName,
        role_id: roleId,
        manager_id: managerId
      };
      inMemoryDB.employees.push(newEmployee);
      return newEmployee;
    }
  },

  // Update an employee's role
  updateEmployeeRole: async (employeeId, roleId) => {
    if (useInMemory) {
      const employee = inMemoryDB.employees.find(e => e.id === employeeId);
      if (employee) {
        employee.role_id = roleId;
      }
      return employee;
    }
    
    try {
      const result = await pool.query(
        'UPDATE employee SET role_id = $1 WHERE id = $2 RETURNING id, first_name, last_name, role_id',
        [roleId, employeeId]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating employee role:', err.message);
      
      // Fallback to in-memory
      const employee = inMemoryDB.employees.find(e => e.id === employeeId);
      if (employee) {
        employee.role_id = roleId;
      }
      return employee;
    }
  },

  // Get all departments for inquirer choices
  getDepartments: async () => {
    if (useInMemory) {
      return inMemoryDB.departments;
    }
    
    try {
      const result = await pool.query('SELECT id, name FROM department ORDER BY name');
      return result.rows;
    } catch (err) {
      console.error('Error getting departments:', err.message);
      return inMemoryDB.departments;
    }
  },

  // Get all roles for inquirer choices
  getRoles: async () => {
    if (useInMemory) {
      return inMemoryDB.roles;
    }
    
    try {
      const result = await pool.query('SELECT id, title FROM role ORDER BY title');
      return result.rows;
    } catch (err) {
      console.error('Error getting roles:', err.message);
      return inMemoryDB.roles;
    }
  },

  // Get all employees for inquirer choices
  getEmployees: async () => {
    if (useInMemory) {
      return inMemoryDB.employees.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`
      }));
    }
    
    try {
      const result = await pool.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee ORDER BY name');
      return result.rows;
    } catch (err) {
      console.error('Error getting employees:', err.message);
      return inMemoryDB.employees.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`
      }));
    }
  },

  // BONUS: Update employee's manager
  updateEmployeeManager: async (employeeId, managerId) => {
    if (useInMemory) {
      const employee = inMemoryDB.employees.find(e => e.id === employeeId);
      if (employee) {
        employee.manager_id = managerId;
      }
      return employee;
    }
    
    try {
      const result = await pool.query(
        'UPDATE employee SET manager_id = $1 WHERE id = $2 RETURNING id, first_name, last_name, manager_id',
        [managerId || null, employeeId]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating employee manager:', err.message);
      
      // Fallback to in-memory
      const employee = inMemoryDB.employees.find(e => e.id === employeeId);
      if (employee) {
        employee.manager_id = managerId;
      }
      return employee;
    }
  },

  // BONUS: View employees by manager
  viewEmployeesByManager: async (managerId) => {
    if (useInMemory) {
      const employees = inMemoryDB.employees.filter(e => e.manager_id === managerId);
      return employees.map(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        const dept = role ? inMemoryDB.departments.find(d => d.id === role.department_id) : null;
        
        return {
          ...emp,
          title: role ? role.title : 'Unknown',
          department: dept ? dept.name : 'Unknown'
        };
      });
    }
    
    try {
      const query = `
        SELECT 
          e.id, 
          e.first_name, 
          e.last_name, 
          r.title, 
          d.name AS department
        FROM employee e
        JOIN role r ON e.role_id = r.id
        JOIN department d ON r.department_id = d.id
        WHERE e.manager_id = $1
        ORDER BY e.last_name, e.first_name
      `;
      const result = await pool.query(query, [managerId]);
      return result.rows;
    } catch (err) {
      console.error('Error viewing employees by manager:', err.message);
      
      // Fallback to in-memory
      const employees = inMemoryDB.employees.filter(e => e.manager_id === managerId);
      return employees.map(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        const dept = role ? inMemoryDB.departments.find(d => d.id === role.department_id) : null;
        
        return {
          ...emp,
          title: role ? role.title : 'Unknown',
          department: dept ? dept.name : 'Unknown'
        };
      });
    }
  },

  // BONUS: View employees by department
  viewEmployeesByDepartment: async (departmentId) => {
    if (useInMemory) {
      const roles = inMemoryDB.roles.filter(r => r.department_id === departmentId);
      const roleIds = roles.map(r => r.id);
      const employees = inMemoryDB.employees.filter(e => roleIds.includes(e.role_id));
      
      return employees.map(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        const manager = emp.manager_id ? inMemoryDB.employees.find(m => m.id === emp.manager_id) : null;
        
        return {
          ...emp,
          title: role ? role.title : 'Unknown',
          manager: manager ? `${manager.first_name} ${manager.last_name}` : null
        };
      });
    }
    
    try {
      const query = `
        SELECT 
          e.id, 
          e.first_name, 
          e.last_name, 
          r.title, 
          CONCAT(m.first_name, ' ', m.last_name) AS manager
        FROM employee e
        JOIN role r ON e.role_id = r.id
        LEFT JOIN employee m ON e.manager_id = m.id
        WHERE r.department_id = $1
        ORDER BY e.last_name, e.first_name
      `;
      const result = await pool.query(query, [departmentId]);
      return result.rows;
    } catch (err) {
      console.error('Error viewing employees by department:', err.message);
      
      // Fallback to in-memory
      const roles = inMemoryDB.roles.filter(r => r.department_id === departmentId);
      const roleIds = roles.map(r => r.id);
      const employees = inMemoryDB.employees.filter(e => roleIds.includes(e.role_id));
      
      return employees.map(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        const manager = emp.manager_id ? inMemoryDB.employees.find(m => m.id === emp.manager_id) : null;
        
        return {
          ...emp,
          title: role ? role.title : 'Unknown',
          manager: manager ? `${manager.first_name} ${manager.last_name}` : null
        };
      });
    }
  },

  // BONUS: Delete department
  deleteDepartment: async (id) => {
    if (useInMemory) {
      const deptIndex = inMemoryDB.departments.findIndex(d => d.id === id);
      if (deptIndex !== -1) {
        const dept = inMemoryDB.departments[deptIndex];
        
        // Delete associated roles and employees
        const rolesToDelete = inMemoryDB.roles.filter(r => r.department_id === id);
        const roleIds = rolesToDelete.map(r => r.id);
        
        // Remove roles with this department
        inMemoryDB.roles = inMemoryDB.roles.filter(r => r.department_id !== id);
        
        // Remove employees with these roles
        inMemoryDB.employees = inMemoryDB.employees.filter(e => !roleIds.includes(e.role_id));
        
        // Remove the department
        inMemoryDB.departments.splice(deptIndex, 1);
        
        return dept;
      }
      return null;
    }
    
    try {
      const result = await pool.query('DELETE FROM department WHERE id = $1 RETURNING id, name', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error deleting department:', err.message);
      
      // Fallback to in-memory
      const deptIndex = inMemoryDB.departments.findIndex(d => d.id === id);
      if (deptIndex !== -1) {
        const dept = inMemoryDB.departments[deptIndex];
        
        // Delete associated roles and employees
        const rolesToDelete = inMemoryDB.roles.filter(r => r.department_id === id);
        const roleIds = rolesToDelete.map(r => r.id);
        
        // Remove roles with this department
        inMemoryDB.roles = inMemoryDB.roles.filter(r => r.department_id !== id);
        
        // Remove employees with these roles
        inMemoryDB.employees = inMemoryDB.employees.filter(e => !roleIds.includes(e.role_id));
        
        // Remove the department
        inMemoryDB.departments.splice(deptIndex, 1);
        
        return dept;
      }
      return null;
    }
  },

  // BONUS: Delete role
  deleteRole: async (id) => {
    if (useInMemory) {
      const roleIndex = inMemoryDB.roles.findIndex(r => r.id === id);
      if (roleIndex !== -1) {
        const role = inMemoryDB.roles[roleIndex];
        
        // Remove employees with this role
        inMemoryDB.employees = inMemoryDB.employees.filter(e => e.role_id !== id);
        
        // Remove the role
        inMemoryDB.roles.splice(roleIndex, 1);
        
        return role;
      }
      return null;
    }
    
    try {
      const result = await pool.query('DELETE FROM role WHERE id = $1 RETURNING id, title', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error deleting role:', err.message);
      
      // Fallback to in-memory
      const roleIndex = inMemoryDB.roles.findIndex(r => r.id === id);
      if (roleIndex !== -1) {
        const role = inMemoryDB.roles[roleIndex];
        
        // Remove employees with this role
        inMemoryDB.employees = inMemoryDB.employees.filter(e => e.role_id !== id);
        
        // Remove the role
        inMemoryDB.roles.splice(roleIndex, 1);
        
        return role;
      }
      return null;
    }
  },

  // BONUS: Delete employee
  deleteEmployee: async (id) => {
    if (useInMemory) {
      // Update manager_id for employees who have this employee as manager
      inMemoryDB.employees.forEach(emp => {
        if (emp.manager_id === id) {
          emp.manager_id = null;
        }
      });
      
      // Find and remove the employee
      const empIndex = inMemoryDB.employees.findIndex(e => e.id === id);
      if (empIndex !== -1) {
        const emp = inMemoryDB.employees[empIndex];
        inMemoryDB.employees.splice(empIndex, 1);
        return emp;
      }
      return null;
    }
    
    try {
      const result = await pool.query(
        'DELETE FROM employee WHERE id = $1 RETURNING id, first_name, last_name', 
        [id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error deleting employee:', err.message);
      
      // Fallback to in-memory
      // Update manager_id for employees who have this employee as manager
      inMemoryDB.employees.forEach(emp => {
        if (emp.manager_id === id) {
          emp.manager_id = null;
        }
      });
      
      // Find and remove the employee
      const empIndex = inMemoryDB.employees.findIndex(e => e.id === id);
      if (empIndex !== -1) {
        const emp = inMemoryDB.employees[empIndex];
        inMemoryDB.employees.splice(empIndex, 1);
        return emp;
      }
      return null;
    }
  },

  // BONUS: View total utilized budget of a department
  viewDepartmentBudget: async (departmentId) => {
    if (useInMemory) {
      const dept = inMemoryDB.departments.find(d => d.id === departmentId);
      if (!dept) {
        return { id: departmentId, name: 'Department', utilized_budget: '0', employee_count: '0' };
      }
      
      const roles = inMemoryDB.roles.filter(r => r.department_id === departmentId);
      const roleIds = roles.map(r => r.id);
      const employees = inMemoryDB.employees.filter(e => roleIds.includes(e.role_id));
      
      let utilized_budget = 0;
      employees.forEach(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        utilized_budget += role ? parseFloat(role.salary) : 0;
      });
      
      return {
        id: dept.id,
        name: dept.name,
        utilized_budget: utilized_budget.toString(),
        employee_count: employees.length.toString()
      };
    }
    
    try {
      const query = `
        SELECT 
          d.id,
          d.name,
          SUM(r.salary) AS utilized_budget,
          COUNT(e.id) AS employee_count
        FROM department d
        JOIN role r ON d.id = r.department_id
        JOIN employee e ON r.id = e.role_id
        WHERE d.id = $1
        GROUP BY d.id, d.name
      `;
      const result = await pool.query(query, [departmentId]);
      return result.rows[0] || { id: departmentId, name: 'Department', utilized_budget: '0', employee_count: '0' };
    } catch (err) {
      console.error('Error viewing department budget:', err.message);
      
      // Fallback to in-memory
      const dept = inMemoryDB.departments.find(d => d.id === departmentId);
      if (!dept) {
        return { id: departmentId, name: 'Department', utilized_budget: '0', employee_count: '0' };
      }
      
      const roles = inMemoryDB.roles.filter(r => r.department_id === departmentId);
      const roleIds = roles.map(r => r.id);
      const employees = inMemoryDB.employees.filter(e => roleIds.includes(e.role_id));
      
      let utilized_budget = 0;
      employees.forEach(emp => {
        const role = inMemoryDB.roles.find(r => r.id === emp.role_id);
        utilized_budget += role ? parseFloat(role.salary) : 0;
      });
      
      return {
        id: dept.id,
        name: dept.name,
        utilized_budget: utilized_budget.toString(),
        employee_count: employees.length.toString()
      };
    }
  }
};