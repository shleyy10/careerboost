import { handleApplicationSubmit } from './formHandler';

async function testSubmission() {
  // Create a mock form element
  const mockForm = {
    resume: { files: [new File(['test'], 'resume.pdf')] },
    'dl-front': { files: [new File(['test'], 'front.jpg')] },
    'dl-back': { files: [new File(['test'], 'back.jpg')] },
    elements: {
      namedItem: (name) => ({ value: mockData[name] })
    }
  };

  const mockData = {
    'full-name': 'Test User',
    email: 'test@example.com',
    phone: '555-123-4567',
    dob: '1990-01-01',
    'marital-status': 'single',
    country: 'US',
    'last-employer': 'Test Company',
    'last-position': 'Test Position',
    'employment-dates': '01/2020 - Present',
    'reason-leaving': 'Testing',
    veteran: 'yes',
    'veteran-rank': 'Test Rank',
    'veteran-branch': 'army',
    'idme-verified': 'yes',
    'idme-email': 'test@id.me',
    ssn: '123-45-6789',
    'mother-maiden': 'Test',
    'birth-place': 'Test City'
  };

  const result = await handleApplicationSubmit(mockForm);
  console.log('Test result:', result);
}

testSubmission();