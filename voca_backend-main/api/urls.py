from django.urls import path

from .Views import register, returnreport, videoanalysis, wordoftheday, keyexchange

urlpatterns = [
    path("register", register.Register.as_view(), name="register"),
    path("fetchreport", returnreport.ReturnReport.as_view(), name="fetchreport"),
    path("videoanalysis", videoanalysis.VideoAnalysis.as_view(), name="videoanalysis"),
    path("wod", wordoftheday.WordOfTheDay.as_view(), name="wod"),
    path("key", keyexchange.KeyExchange.as_view(), name="keyx")
    # path("csrf", views.gen_csrf, name="csrf_gen"),
]
