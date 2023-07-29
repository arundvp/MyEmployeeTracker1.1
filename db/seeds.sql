-- seeds.sql
INSERT INTO department (id, name) VALUES
  (1, 'Sales'),
  (2, 'Marketing'),
  (3, 'Engineering');

-- seeds.sql
INSERT INTO role (id, title, salary, department_id) VALUES
  (1, 'Sales Manager', 60000.00, 1),
  (2, 'Sales Representative', 40000.00, 1),
  (3, 'Marketing Manager', 55000.00, 2),
  (4, 'Marketing Coordinator', 35000.00, 2),
  (5, 'Software Engineer', 80000.00, 3),
  (6, 'UI/UX Designer', 70000.00, 3);


-- seeds.sql
INSERT INTO employee (id, first_name, last_name, role_id, manager_id) VALUES
  (1, 'John', 'Doe', 1, NULL),
  (2, 'Jane', 'Smith', 2, 1),
  (3, 'Mike', 'Johnson', 3, 1),
  (4, 'Emily', 'Brown', 4, 2),
  (5, 'Chris', 'Lee', 5, 3),
  (6, 'Sarah', 'Williams', 6, 3);