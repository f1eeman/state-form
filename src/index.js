
import _ from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

const schema = yup.object().shape({
  email: yup.string().required().email(),
  password: yup.string().required().min(6),
  passwordConfirmation: yup.string()
    .required()
    .oneOf(
      [yup.ref('password'), null],
      'Password confirmation does not match to password',
    ),
});

const errorMessages = {
  network: {
    error: 'Network Problems. Try again.',
  },
};

// Используйте эту функцию для выполнения валидации
const validate = (fields) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return {};
  } catch (e) {
    return _.keyBy(e.inner, 'path');
  }
};

// BEGIN (write your solution here)
const updateValidationState = (watchedState) => {
  const errors = validate(watchedState.form.fields);
  watchedState.form.valid = _.isEqual(errors, {});
  watchedState.form.errors = errors;
};

const renderErrors = (elements, errors) => {
  Object.entries(elements).forEach(([name, element]) => {
    const errorElement = element.nextElementSibling;
    const error = errors[name];
    if (errorElement) {
      element.classList.remove('is-invalid');
      errorElement.remove();
    }
    if (!error) {
      return;
    }
    const feedbackElement = document.createElement('div');
    feedbackElement.classList.add('invalid-feedback');
    feedbackElement.innerHTML = error.message;
    element.classList.add('is-invalid');
    element.after(feedbackElement);
  });
};

const app = () => {
  const state = {
    form: {
      processState: 'filling',
      processError: null,
      fields: {
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
      },
      valid: true,
      errors: {},
    },
  };

  const container = document.querySelector('[data-container="sign-up"]');
  const form = document.querySelector('[data-form="sign-up"]');
  const fieldElements = {
    name: document.getElementById('sign-up-name'),
    email: document.getElementById('sign-up-email'),
    password: document.getElementById('sign-up-password'),
    passwordConfirmation: document.getElementById('sign-up-password-confirmation'),
  };
  const submitButton = form.querySelector('[type="submit"]');

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'failed':
        submitButton.disabled = false;
        break;
      case 'filling':
        submitButton.disabled = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      case 'finished':
        container.innerHTML = 'User Created!';
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value);
        break;
      case 'form.valid':
        submitButton.disabled = !value;
        break;
      case 'form.errors':
        renderErrors(fieldElements, value);
        break;
      default:
        break;
    }
  });

  Object.entries(fieldElements).forEach(([name, element]) => {
    element.addEventListener('input', (e) => {
      watchedState.form.fields[name] = e.target.value;
      updateValidationState(watchedState);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    watchedState.form.processState = 'sending';
    try {
      await axios.post('https://web-js-frontend-architecture-forms-2164340.evaluator5-2.hexlet.io/users', watchedState.form.fields);
      watchedState.form.processState = 'finished';
    } catch (err) {
      // В реальных приложениях также требуется корректно обрабатывать сетевые ошибки
      watchedState.form.processError = errorMessages.network.error;
      watchedState.form.processState = 'failed';
      // здесь это опущено в целях упрощения приложения
      throw err;
    }
  });
};
// END

app();
