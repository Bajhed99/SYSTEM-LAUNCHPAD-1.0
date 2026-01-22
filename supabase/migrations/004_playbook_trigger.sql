-- Function to automatically trigger playbook after meeting analysis
CREATE OR REPLACE FUNCTION trigger_playbook_after_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if meeting status changed to 'analyzed'
  IF NEW.status = 'analyzed' AND OLD.status != 'analyzed' THEN
    -- Insert playbook run record (actual execution handled by API/webhook)
    INSERT INTO playbook_runs (
      organization_id,
      meeting_id,
      playbook_type,
      status,
      payload
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'ghl_sync',
      'pending',
      jsonb_build_object('meeting_id', NEW.id, 'triggered_by', 'status_change')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on meetings table
CREATE TRIGGER meetings_playbook_trigger
AFTER UPDATE ON meetings
FOR EACH ROW
WHEN (NEW.status = 'analyzed' AND OLD.status != 'analyzed')
EXECUTE FUNCTION trigger_playbook_after_analysis();
