from django.urls import path
from . import user
from . import views


urlpatterns = [
    path("register/", user.register, name="register"),
    path("login/", user.login, name="login"),
    path("me/", user.me, name="me"),

    path("employees/", user.employee_list),
    path("managers/", user.manager_list),
    path("users/", user.user_list),
    path("approve/<int:id>/", user.approve_employee),
    path("delete/<int:id>/", user.delete_employee),
    path("assign-work/", views.assign_work),
    path("employee-work/<int:employee_id>/", views.employee_work),
     path("update-work/<int:pk>/", views.update_work),
    path("delete-work/<int:pk>/", views.delete_work),
    path("all-work/", views.all_work),
    path("messages/<int:user_id>/<int:contact_id>/", views.conversation),
    path("messages/<int:user_id>/<int:contact_id>/seen/", views.mark_conversation_seen),
    path("messages/unread/<int:user_id>/", views.unread_message_count),
    path("messages/summaries/<int:user_id>/", views.message_summaries),
    path("messages/send/", views.send_message),
    path("messages/<int:pk>/edit/", views.edit_message),
    path("messages/<int:pk>/delete/", views.delete_message),
]
