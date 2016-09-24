package com.example.admin.quickcart;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by admin on 9/24/16.
 */
public interface OnTaskCompleted{
    void onTaskCompleted(JSONObject jsonObject) throws JSONException;
}
