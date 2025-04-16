const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  
  // View all departments
  viewAllDepartments: async () => {
    const result = await pool.query('SELECT id, name FROM department ORDER BY id');
    return result.rows;
  },

  // View all roles with department names
  viewAllRoles: async () => {
    const query = `
      SELECT r.id, r.title, r.salary, d.name AS department
      FROM role r
      JOIN department d ON r.department_id = d.id
      ORDER BY r.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // View all employees with role, department, and manager info
  viewAllEmployees: async () => {
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
  },

  // Add a department
  addDepartment: async (name) => {
    const result = await pool.query(
      'INSERT INTO department (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    return result.rows[0];
  },

  // Add a role
  addRole: async (title, salary, departmentId) => {
    const result = await pool.query(
      'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3) RETURNING id, title, salary, department_id',
      [title, salary, departmentId]
    );
    return result.rows[0];
  },

  // Add an employee
  addEmployee: async (firstName, lastName, roleId, managerId) => {
    const result = await pool.query(
      'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, role_id, manager_id',
      [firstName, lastName, roleId, managerId || null]
    );
    return result.rows[0];
  },

  // Update an employee's role
  updateEmployeeRole: async (employeeId, roleId) => {
    const result = await pool.query(
      'UPDATE employee SET role_id = $1 WHERE id = $2 RETURNING id, first_name, last_name, role_id',
      [roleId, employeeId]
    );
    return result.rows[0];
  },

  // Get all departments for inquirer choices
  getDepartments: async () => {
    const result = await pool.query('SELECT id, name FROM department ORDER BY name');
    return result.rows;
  },

  // Get all roles for inquirer choices
  getRoles: async () => {
    const result = await pool.query('SELECT id, title FROM role ORDER BY title');
    return result.rows;
  },

  // Get all employees for inquirer choices
  getEmployees: async () => {
    const result = await pool.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee ORDER BY name');
    return result.rows;
  },

  // BONUS: Update employee's manager
  updateEmployeeManager: async (employeeId, managerId) => {
    const result = await pool.query(
      'UPDATE employee SET manager_id = $1 WHERE id = $2 RETURNING id, first_name, last_name, manager_id',
      [managerId || null, employeeId]
    );
    return result.rows[0];
  },

  // BONUS: View employees by manager
  viewEmployeesByManager: async (managerId) => {
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
  },

  // BONUS: View employees by department
  viewEmployeesByDepartment: async (departmentId) => {
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
  },

  // BONUS: Delete department
  deleteDepartment: async (id) => {
    const result = await pool.query('DELETE FROM department WHERE id = $1 RETURNING id, name', [id]);
    return result.rows[0];
  },

  // BONUS: Delete role
  deleteRole: async (id) => {
    const result = await pool.query('DELETE FROM role WHERE id = $1 RETURNING id, title', [id]);
    return result.rows[0];
  },

  // BONUS: Delete employee
  deleteEmployee: async (id) => {
    const result = await pool.query(
      'DELETE FROM employee WHERE id = $1 RETURNING id, first_name, last_name', 
      [id]
    );
    return result.rows[0];
  },

  // BONUS: View total utilized budget of a department
  viewDepartmentBudget: async (departmentId) => {
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
  }
};