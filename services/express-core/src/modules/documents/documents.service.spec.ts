import { renderDocumentTemplate } from './documents.service';

describe('Document Template Rendering Engine', () => {
  
  test('Correctly replaces multiple distinct merge fields', () => {
    const template = 'Dear {employee_name}, we are pleased to offer you the role of {job_title} with a basic salary of {salary} RWF.';
    const fields = {
      employee_name: 'Shyaka Alex',
      job_title: 'Software Architect',
      salary: 2500000
    };

    const result = renderDocumentTemplate(template, fields);

    expect(result).toBe('Dear Shyaka Alex, we are pleased to offer you the role of Software Architect with a basic salary of 2500000 RWF.');
  });

  test('Leaves placeholder tag unchanged when merge field mapping is missing', () => {
    const template = 'Contract for {employee_name} at company {company_name}.';
    const fields = {
      employee_name: 'Mugisha Christian'
      // company_name is missing
    };

    const result = renderDocumentTemplate(template, fields);

    expect(result).toBe('Contract for Mugisha Christian at company {company_name}.');
  });

  test('Supports numeric and string values in merge fields', () => {
    const template = 'Reference ID: {ref_id}, Grade: {grade_level}';
    const fields = {
      ref_id: 98765,
      grade_level: 'A+'
    };

    const result = renderDocumentTemplate(template, fields);

    expect(result).toBe('Reference ID: 98765, Grade: A+');
  });
});
