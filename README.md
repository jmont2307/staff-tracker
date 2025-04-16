# Employee Tracker

A command-line application to manage a company's employee database, using Node.js, Inquirer, and PostgreSQL.

## Description

This Employee Tracker is a Content Management System (CMS) that allows business owners to view and manage departments, roles, and employees in their company. The application provides an easy-to-use interface for organizing and planning business operations.

## Features

- View all departments, roles, and employees
- Add departments, roles, and employees
- Update employee roles
- Update employee managers
- View employees by manager
- View employees by department
- Delete departments, roles, and employees
- View the total utilized budget of a department

## Installation

1. Clone the repository to your local machine:
```
git clone https://github.com/jmont2307/staff-tracker
cd staff-tracker
```

2. Install the required dependencies:
```
npm install
```

3. Set up your PostgreSQL database:
   - Create a `.env` file in the root directory with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=employee_db
   DB_PORT=5432
   ```
   - Run the schema and seed files to create and populate the database:
   ```
   psql -U your_username -f schema.sql
   psql -U your_username -f seeds.sql
   ```

## Usage

1. Start the application:
```
node index.js
```

2. Use the arrow keys to navigate through the menu options and press Enter to select an option.

3. Follow the prompts to view, add, update, or delete information in the database.

## Demo

[Link to video demonstration](your_video_link_here)

## Screenshots

![Employee Tracker Main Menu](screenshot_link_here)

## Technologies Used

- Node.js
- Inquirer.js
- PostgreSQL
- console.table
- dotenv

## License

This project is licensed under the MIT License - see the LICENSE file for details.


