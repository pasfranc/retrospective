import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ArrowLeft } from 'lucide-react';

export default function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [emails, setEmails] = useState('');
  const [facilitatorEmail, setFacilitatorEmail] = useState('');
  const [votesPerPerson, setVotesPerPerson] = useState(3);
  const [magicLinks, setMagicLinks] = useState([]);
  const [copied, setCopied] = useState({});
  const [loading, setLoading] = useState(false);

  const emailList = emails
    .split('\n')
    .map(e => e.trim())
    .filter(e => e.length > 0);

  const handleCreateSession = async () => {
    if (emailList.length < 2) {
      alert('Please add at least 2 email addresses');
      return;
    }

    if (!facilitatorEmail || !emailList.includes(facilitatorEmail)) {
      alert('Please select a facilitator from the email list');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailList,
          facilitatorEmail,
          votesPerPerson
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setMagicLinks(data.magicLinks);
      setStep(2);
    } catch (error) {
      console.error('Session creation error:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, email) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [email]: true });
    setTimeout(() => {
      setCopied({ ...copied, [email]: false });
    }, 2000);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="card">
            <h1 className="text-2xl font-bold mb-6">Session Created!</h1>

            <div className="bg-green-50 border border-success rounded-lg p-4 mb-6">
              <p className="text-success font-medium mb-2">Share these magic links with your team:</p>
              <p className="text-sm text-slate-600">Each participant should click their unique link to join.</p>
            </div>

            <div className="space-y-3">
              {magicLinks.map(link => (
                <div key={link.email} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{link.email}</span>
                      {link.role === 'facilitator' && (
                        <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">
                          Facilitator
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-slate-600 break-all">{link.link}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(link.link, link.email)}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                  >
                    {copied[link.email] ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => navigate('/')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back to Home
              </button>
              <button
                onClick={() => {
                  const facilitatorLink = magicLinks.find(l => l.role === 'facilitator');
                  if (facilitatorLink) {
                    window.location.href = facilitatorLink.link;
                  }
                }}
                className="btn-primary"
              >
                Join as Facilitator
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto py-8">
        <button onClick={() => navigate('/')} className="btn-secondary mb-6">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          Back
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Create Retrospective Session</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Participant Emails (one per line)
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="input min-h-[150px] font-mono text-sm"
                placeholder="alice@company.com&#10;bob@company.com&#10;charlie@company.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                {emailList.length} email{emailList.length !== 1 ? 's' : ''} added
              </p>
            </div>

            {emailList.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Facilitator
                </label>
                <select
                  value={facilitatorEmail}
                  onChange={(e) => setFacilitatorEmail(e.target.value)}
                  className="input"
                >
                  <option value="">-- Choose facilitator --</option>
                  {emailList.map(email => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Votes per Person
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={votesPerPerson}
                onChange={(e) => setVotesPerPerson(parseInt(e.target.value))}
                className="input"
              />
              <p className="text-xs text-slate-500 mt-1">
                Each participant can cast this many votes during the voting phase
              </p>
            </div>

            <button
              onClick={handleCreateSession}
              disabled={loading || emailList.length < 2 || !facilitatorEmail}
              className="btn-primary w-full"
            >
              {loading ? 'Creating...' : 'Generate Session & Magic Links'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
