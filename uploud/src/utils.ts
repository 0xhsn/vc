const MAX_ID_LENGTH = 5;

export const generate_deployment_id = () => {
  return Math.random().toString(36).substr(2, MAX_ID_LENGTH);
}

