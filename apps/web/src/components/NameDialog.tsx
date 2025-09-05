import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface NameDialogProps {
  onNameSubmit: (name: string) => void;
}

const NameDialog: React.FC<NameDialogProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    
    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    
    // Basic validation - only allow letters, numbers, spaces, and basic punctuation
    if (!/^[a-zA-Z0-9\s\-_'.]+$/.test(trimmedName)) {
      setError('Name can only contain letters, numbers, spaces, and basic punctuation');
      return;
    }
    
    onNameSubmit(trimmedName);
  }, [name, onNameSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 max-w-[90vw] bg-white shadow-xl">
        <CardHeader className="text-center pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Welcome to Omniverse!</h2>
          <p className="text-gray-600">Enter your name to join the virtual world</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(''); // Clear error when user types
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex justify-center pt-2">
            <Button 
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NameDialog;
