const PasswordRules = ({ password, confirmPassword }) => {
    const rules = [
      {
        id: "length",
        label: "At least 8 characters",
        valid: password.length >= 8,
      },
      {
        id: "uppercase",
        label: "At least one uppercase letter",
        valid: /[A-Z]/.test(password),
      },
      {
        id: "lowercase",
        label: "At least one lowercase letter",
        valid: /[a-z]/.test(password),
      },
      {
        id: "number",
        label: "At least one number",
        valid: /[0-9]/.test(password),
      },
      {
        id: "special",
        label: "At least one special character",
        valid: /[^A-Za-z0-9]/.test(password),
      },
      {
        id: "match",
        label: "Passwords match",
        valid:
          confirmPassword.length > 0 &&
          password === confirmPassword,
      },
    ];
  
    return (
      <div className="password-rules" aria-live="polite">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`password-rule ${
              rule.valid ? "valid" : "invalid"
            }`}
          >
            <span className="password-rule-icon">
              {rule.valid ? "✓" : "×"}
            </span>
  
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    );
  };
  
  export default PasswordRules;