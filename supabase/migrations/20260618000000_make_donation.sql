CREATE OR REPLACE FUNCTION public.make_donation(
  p_user_id uuid,
  p_shelter_id uuid,
  p_points integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points INTEGER;
  v_shelter_name TEXT;
  v_result JSON;
BEGIN
  -- Баланс = сумма строк user_points (единый источник правды)
  SELECT COALESCE(SUM(points), 0) INTO v_current_points
  FROM user_points
  WHERE user_id = p_user_id;

  IF v_current_points < p_points THEN
    RAISE EXCEPTION 'Insufficient points. Current: %, Required: %', v_current_points, p_points;
  END IF;

  SELECT name INTO v_shelter_name
  FROM shelters
  WHERE id = p_shelter_id AND active = true;

  IF v_shelter_name IS NULL THEN
    RAISE EXCEPTION 'Shelter not found or inactive';
  END IF;

  -- Списание: отрицательная строка в журнале
  INSERT INTO user_points (user_id, points, reason)
  VALUES (p_user_id, -p_points, 'Donation to ' || v_shelter_name);

  INSERT INTO charity_donations (user_id, shelter_id, points_spent, shelter_name)
  VALUES (p_user_id, p_shelter_id, p_points, v_shelter_name);

  UPDATE shelters
  SET total_donations = total_donations + p_points
  WHERE id = p_shelter_id;

  -- Новый баланс = пересчитанная сумма
  SELECT COALESCE(SUM(points), 0) INTO v_current_points
  FROM user_points
  WHERE user_id = p_user_id;

  v_result := json_build_object(
    'success', true,
    'new_balance', v_current_points,
    'shelter_name', v_shelter_name,
    'points_spent', p_points
  );

  RETURN v_result;
END;
$$;
