import React from "react";
import { Consent } from "@empirica/core/player/react";

export function MyConsent({ onConsent }) {
  const handleConsent = () => {
    console.log("Consent given");
    next();
  };

  const consentText = (
    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
      <p style={{ marginBottom: '1em' }}>Welcome,</p>

      <p style={{ marginBottom: '1em' }}>
        We wish to invite you to participate in a study exploring the mechanisms of creative collaboration in an item naming task. Your participation involves performing a computer-based task in which you and a partner will be asked to name items from different categories within a time limit.
      </p>

      <p style={{ marginBottom: '1em' }}>Important Information:</p>
      <div style={{ marginLeft: '1em', marginBottom: '1em' }}>
        • Your participation is completely voluntary and you may choose to withdraw at any time<br/>
        • No significant risks or discomforts are expected with this experiment<br/>
        • We are not collecting information that can be used to identify you, and only your unique and anonymized Prolific ID can be used to identify your responses<br/>
        • Completed surveys will be kept on a secure, password-protected computer accessible only to the research team<br/>
        • You can withdraw your data at any time by contacting the researcher and mentioning your Prolific ID<br/>
        • Non-identifiable data (i.e., removing Prolific IDs) will be made publicly available through the Open Science Framework to allow other researchers to work with the data<br/>
        • We’ll never ask for your name or signature. Results will not be released or reported in any way that might allow for identification of individual participants<br/>
      </div>

      <p style={{ marginBottom: '1em' }}>By clicking "I Agree" below, you confirm that:</p>
      <div style={{ marginLeft: '1em' }}>
        • I have read and understand the above information<br/>
        • I have had the opportunity to ask questions and have them answered<br/>
        • I understand that all personal data will remain confidential to the extent allowed by law<br/>
        • I understand that my participation is voluntary and that I am free to withdraw without giving any justifications, and that my data will be removed unless already published, in pooled form, in scientific journals<br/>
        • I agree to take part in this study<br/>
      </div>
    </div>
  );

  return (
    <Consent
      title="Informed Consent"
      text={consentText}
      buttonText="I Agree"
      onConsent={onConsent}
    />
  );
}