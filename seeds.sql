\c employee_db;

-- Insert departments
INSERT INTO department (name) VALUES
('Engineering'),
('Finance'),
('Legal'),
('Sales'),
('Human Resources');

-- Insert roles
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
('HR Specialist', 115000, 5);

-- Insert employees
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
('Ana', 'Bell', 10, 9);
